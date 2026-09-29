import { mockApi, tenant, tokens } from "@/test/mockApi";
import { STORAGE_KEY, sessionStore } from "./sessionStore";

afterEach(() => {
  sessionStore.clear();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("sessionStore", () => {
  it("garde l'access token en mémoire et seulement le refresh token en localStorage", () => {
    sessionStore.open(tokens(), tenant);

    expect(sessionStore.getAccessToken()).toBe("access-1");
    const stored = localStorage.getItem(STORAGE_KEY) ?? "";
    expect(stored).toContain("refresh-1");
    expect(stored).not.toContain("access-1");
  });

  it("ne lance qu'un seul refresh pour des demandes simultanées", async () => {
    const { calls } = mockApi({ "POST /tenants/refresh": () => [200, tokens("2")] });
    sessionStore.open(tokens(), tenant);

    const results = await Promise.all([sessionStore.refresh(), sessionStore.refresh()]);

    expect(results).toEqual([true, true]);
    expect(calls.filter(({ route }) => route === "POST /tenants/refresh")).toHaveLength(1);
    expect(sessionStore.getAccessToken()).toBe("access-2");
  });

  it("efface la session si le refresh est refusé", async () => {
    mockApi({ "POST /tenants/refresh": () => [401, { error: { code: "invalidRefreshToken" } }] });
    sessionStore.open(tokens(), tenant);

    await expect(sessionStore.refresh()).resolves.toBe(false);
    expect(sessionStore.getUser()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("révoque le refresh token à la déconnexion", async () => {
    const { calls } = mockApi({ "POST /tenants/logout": () => [200, {}] });
    sessionStore.open(tokens(), tenant);

    await sessionStore.logout();

    expect(calls).toEqual([{ route: "POST /tenants/logout", body: { refreshToken: "refresh-1" } }]);
    expect(sessionStore.getUser()).toBeNull();
  });
});
