/**
 * Test de contrat contre une API réelle (ignoré par `npm test`) : voir README, « Test de contrat ».
 */
import { execSync } from "node:child_process";
import { configureHttpAuth } from "@/lib/http";
import { appsApi } from "./apps.api";
import { authApi } from "./auth.api";

const baseUrl = process.env.API_CONTRACT_URL;
// Le client HTTP vise API_CONTRACT_URL, jamais l'API de VITE_API_BASE_URL (souvent l'API de dev et sa vraie base).
vi.mock("@/config/env", () => ({
  env: { apiBaseUrl: (process.env.API_CONTRACT_URL ?? "").replace(/\/+$/, "") },
}));
const readCode = () =>
  execSync(process.env.API_CONTRACT_CODE_CMD ?? "", { encoding: "utf-8" }).trim();

describe.skipIf(!baseUrl)("Contrat apps.api avec l'API réelle", () => {
  afterAll(() => configureHttpAuth(null));

  it("valide chaque réponse du cycle de vie d'une application", async () => {
    const email = `contract-apps-${Date.now()}@test.dev`;
    const password = "Password1!";
    await authApi.register({
      firstName: "Contract",
      lastName: "Apps",
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
      mfaVerificationMode: "link",
      requireEmailVerification: true,
    });

    const list = await appsApi.list(user.tenantId, 1, 10);
    expect(list.total).toBe(1);
    expect(list.data[0].id).toBe(appId);

    const app = await appsApi.get(user.tenantId, appId);
    expect(app.mfaSettings?.verificationMode).toBe("link");
    expect(app.requireEmailVerification).toBe(true);

    await appsApi.setActive(user.tenantId, appId, false);
    expect((await appsApi.get(user.tenantId, appId)).isActive).toBe(false);

    const { secretKey } = await appsApi.rotateSecret(user.tenantId, appId);
    expect(secretKey).not.toBe(app.secretKey);
  });
});
