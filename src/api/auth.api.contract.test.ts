/**
 * Test de contrat contre une API réelle (pas lancé par `npm test`) :
 *   API_CONTRACT_URL=http://localhost:8080 npx vitest run src/api/auth.api.contract.test.ts
 * Les codes reçus par e-mail sont lus par la fonction fournie dans API_CONTRACT_CODE_CMD (voir README).
 */
import { execSync } from "node:child_process";
import { authApi } from "./auth.api";

const baseUrl = process.env.API_CONTRACT_URL;
// Le client HTTP vise API_CONTRACT_URL, jamais l'API de VITE_API_BASE_URL (souvent l'API de dev et sa vraie base).
vi.mock("@/config/env", () => ({
  env: { apiBaseUrl: (process.env.API_CONTRACT_URL ?? "").replace(/\/+$/, "") },
}));
const readCode = () =>
  execSync(process.env.API_CONTRACT_CODE_CMD ?? "", { encoding: "utf-8" }).trim();

describe.skipIf(!baseUrl)("Contrat auth.api avec l'API réelle", () => {
  it("valide chaque réponse du parcours complet avec les schémas du front", async () => {
    const email = `contract-${Date.now()}@test.dev`;
    const password = "Password1!";

    await authApi.register({
      firstName: "Contract",
      lastName: "Test",
      email,
      password,
      confirmPassword: password,
    });
    const verified = await authApi.verifyEmail(email, readCode());
    expect(verified.user.email).toBe(email);

    await authApi.login(email, password);
    const session = await authApi.loginByMFACode(email, readCode());
    expect(session.user.tenantId).toBe(verified.user.tenantId);

    const refreshed = await authApi.refresh(session.refresh_token);
    expect(refreshed.access_token).not.toBe(session.access_token);

    await authApi.logout(refreshed.refresh_token);
    await expect(authApi.refresh(refreshed.refresh_token)).rejects.toMatchObject({
      code: "invalidRefreshToken",
    });
  });
});
