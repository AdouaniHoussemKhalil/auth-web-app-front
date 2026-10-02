/**
 * Test de contrat contre une API réelle (ignoré par `npm test`) : voir README, « Test de contrat ».
 */
import { execSync } from "node:child_process";
import { configureHttpAuth } from "@/lib/http";
import { appsApi } from "./apps.api";
import { authApi } from "./auth.api";
import { consumersApi } from "./consumers.api";

const baseUrl = process.env.API_CONTRACT_URL;
// Le client HTTP vise API_CONTRACT_URL, jamais l'API de VITE_API_BASE_URL (souvent l'API de dev et sa vraie base).
vi.mock("@/config/env", () => ({
  env: { apiBaseUrl: (process.env.API_CONTRACT_URL ?? "").replace(/\/+$/, "") },
}));
const readCode = () =>
  execSync(process.env.API_CONTRACT_CODE_CMD ?? "", { encoding: "utf-8" }).trim();

describe.skipIf(!baseUrl)("Contrat consumers.api avec l'API réelle", () => {
  afterAll(() => configureHttpAuth(null));

  it("valide la liste, la recherche, le blocage et la suppression des utilisateurs", async () => {
    const email = `contract-users-${Date.now()}@test.dev`;
    const password = "Password1!";
    await authApi.register({
      firstName: "Contract",
      lastName: "Users",
      email,
      password,
      confirmPassword: password,
    });
    const { access_token, user } = await authApi.verifyEmail(email, readCode());
    configureHttpAuth({
      getAccessToken: () => access_token,
      getTenantId: () => user.tenantId,
      refreshSession: async () => false,
    });
    const { appId } = await appsApi.create(user.tenantId, {
      name: "Contrat",
      redirectUrl: "https://contrat.test",
      resetPasswordUrl: "https://contrat.test/reset",
      supportEmail: "support@contrat.test",
    });
    const { secretKey } = await appsApi.get(user.tenantId, appId);

    // Un utilisateur s'inscrit sur l'application, comme le ferait son back-end.
    const register = await fetch(`${baseUrl}/consumers/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-app-id": appId, "x-app-secret": secretKey },
      body: JSON.stringify({
        firstName: "Bob",
        lastName: "Durand",
        email: "bob@contrat.test",
        password,
        confirmPassword: password,
      }),
    });
    expect(register.status).toBe(201);

    const list = await consumersApi.list(user.tenantId, appId, { page: 1, limit: 20 });
    expect(list.total).toBe(1);
    const [consumer] = list.data;
    expect(consumer).toMatchObject({ email: "bob@contrat.test", isActive: true });

    const search = await consumersApi.list(user.tenantId, appId, {
      page: 1,
      limit: 20,
      email: "nobody",
    });
    expect(search.total).toBe(0);

    expect((await consumersApi.setActive(user.tenantId, appId, consumer.id, false)).isActive).toBe(
      false,
    );
    expect((await consumersApi.setActive(user.tenantId, appId, consumer.id, true)).isActive).toBe(
      true,
    );

    await consumersApi.remove(user.tenantId, appId, consumer.id);
    expect((await consumersApi.list(user.tenantId, appId, { page: 1, limit: 20 })).total).toBe(0);
  });
});
