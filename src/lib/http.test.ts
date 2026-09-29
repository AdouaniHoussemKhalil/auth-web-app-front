import { ApiError, configureHttpAuth, http } from "./http";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const apiError = (status: number, code: string) =>
  json(status, { error: { status, code, message: code, isSuccess: false, details: null } });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  configureHttpAuth(null);
  vi.unstubAllGlobals();
});

describe("http", () => {
  it("renvoie le corps JSON et construit l'URL avec la query string", async () => {
    fetchMock.mockResolvedValue(json(200, { data: [] }));

    await expect(
      http("/config/apps/t1", { query: { page: 2, limit: undefined } }),
    ).resolves.toEqual({
      data: [],
    });
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/config/apps/t1?page=2");
  });

  it("joint le token et le tenant quand la session est branchée", async () => {
    configureHttpAuth({
      getAccessToken: () => "token-1",
      getTenantId: () => "tenant-1",
      refreshSession: async () => false,
    });
    fetchMock.mockResolvedValue(json(200, {}));

    await http("/config/apps/tenant-1");

    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({
      Authorization: "Bearer token-1",
      "X-Tenant-Id": "tenant-1",
    });
  });

  it("transforme le format d'erreur de l'API en ApiError", async () => {
    fetchMock.mockResolvedValue(apiError(401, "invalidCredentials"));

    await expect(http("/tenants/login", { method: "POST", auth: false })).rejects.toMatchObject({
      status: 401,
      code: "invalidCredentials",
    });
  });

  it("renouvelle la session une fois puis rejoue la requête sur un token révoqué", async () => {
    let token = "expired";
    const refreshSession = vi.fn(async () => {
      token = "fresh";
      return true;
    });
    configureHttpAuth({ getAccessToken: () => token, getTenantId: () => "t1", refreshSession });
    fetchMock
      .mockResolvedValueOnce(apiError(403, "invalidToken"))
      .mockResolvedValueOnce(json(200, { ok: true }));

    await expect(http("/config/apps/t1")).resolves.toEqual({ ok: true });
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer fresh");
  });

  it("ne tente pas de refresh pour une erreur métier", async () => {
    const refreshSession = vi.fn(async () => true);
    configureHttpAuth({ getAccessToken: () => "t", getTenantId: () => "t1", refreshSession });
    fetchMock.mockResolvedValue(apiError(403, "insufficientScope"));

    await expect(http("/config/apps/create", { method: "POST", body: {} })).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it("signale une panne réseau", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(http("/health", { auth: false })).rejects.toMatchObject({ code: "networkError" });
  });
});
