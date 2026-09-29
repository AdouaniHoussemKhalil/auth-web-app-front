/**
 * Simule l'API route par route : `mockApi({ "POST /tenants/login": () => [200, { MFARequired: true }] })`.
 * La route ignore la query string, transmise au handler (`query.get("page")`).
 * Une route non déclarée répond 404, ce qui fait échouer le test de façon visible.
 */
type Handler = (body: unknown, query: URLSearchParams) => [number, unknown];

export const apiError = (status: number, code: string): [number, unknown] => [
  status,
  { error: { status, code, message: code, isSuccess: false, details: null } },
];

export const mockApi = (handlers: Record<string, Handler>) => {
  const calls: { route: string; body: unknown }[] = [];

  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const { pathname, searchParams } = new URL(url);
    const route = `${init?.method ?? "GET"} ${pathname}`;
    const body = init?.body ? JSON.parse(init.body as string) : undefined;
    calls.push({ route, body });

    const handler = handlers[route];
    const [status, payload] = handler
      ? handler(body, searchParams)
      : apiError(404, "routeNotFound");
    return new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  });

  vi.stubGlobal("fetch", fetchMock);
  return { calls, fetchMock };
};

export const tenant = {
  tenantId: "tenant-1",
  firstName: "Alice",
  lastName: "Martin",
  email: "alice@test.com",
  scopes: ["app:read"],
};

export const tokens = (suffix = "1") => ({
  access_token: `access-${suffix}`,
  refresh_token: `refresh-${suffix}`,
});
