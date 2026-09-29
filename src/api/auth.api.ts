import { z } from "zod";
import { http } from "@/lib/http";

// Schémas des réponses de l'API : chaque réponse est validée avant d'être utilisée.
export const tenantUserSchema = z.object({
  tenantId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  scopes: z.array(z.string()).default([]),
});

export const tokenPairSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});

export type TenantUser = z.infer<typeof tenantUserSchema>;
export type TokenPair = z.infer<typeof tokenPairSchema>;
export type AuthenticatedResponse = TokenPair & { user: TenantUser };

export interface RegisterBody {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Toutes ces routes sont publiques : pas de token, pas de renouvellement automatique.
const publicPost = <T>(path: string, body: unknown, schema: z.ZodType<T>) =>
  http<unknown>(path, { method: "POST", body, auth: false }).then((data) => schema.parse(data));

export const authApi = {
  /** L'inscription n'ouvre pas de session : un code de vérification est envoyé par e-mail. */
  register: (body: RegisterBody) =>
    publicPost("/tenants/register", body, z.object({ email: z.string() })),

  /** Vérifie l'e-mail et ouvre la session. */
  verifyEmail: (email: string, code: string): Promise<AuthenticatedResponse> =>
    publicPost(
      "/tenants/verifyEmail",
      { email, code },
      tokenPairSchema.extend({ user: tenantUserSchema }),
    ),

  resendEmailVerification: (email: string) =>
    publicPost("/tenants/resendEmailVerification", { email }, z.unknown()),

  /** Première étape : vérifie le mot de passe ; l'API envoie un code MFA par e-mail. */
  login: (email: string, password: string) =>
    publicPost("/tenants/login", { email, password }, z.object({ MFARequired: z.boolean() })),

  /** Seconde étape : valide le code MFA et ouvre la session. */
  loginByMFACode: (email: string, mfaCode: string): Promise<AuthenticatedResponse> =>
    publicPost(
      "/tenants/loginByMFACode",
      { email, mfaCode },
      tokenPairSchema.extend({ result: tenantUserSchema }),
    ).then(({ result, ...tokens }) => ({ ...tokens, user: result })),

  /** Envoie un code de réinitialisation ; même réponse que le compte existe ou non. */
  forgotPassword: (email: string) => publicPost("/tenants/forgotPassword", { email }, z.unknown()),

  /** Échange le code reçu par e-mail contre un jeton de réinitialisation à usage unique. */
  verifyResetCode: (email: string, resetCode: string) =>
    publicPost(
      "/tenants/verifyResetCode",
      { email, resetCode },
      z.object({ resetToken: z.string() }),
    ),

  /** Nouveau mot de passe ; l'API ferme toutes les sessions du tenant. */
  resetPassword: (body: {
    email: string;
    resetToken: string;
    password: string;
    confirmPassword: string;
  }) =>
    http<unknown>("/tenants/resetPassword", { method: "PUT", body, auth: false }).then(
      () => undefined,
    ),

  refresh: (refreshToken: string): Promise<TokenPair> =>
    publicPost("/tenants/refresh", { refreshToken }, tokenPairSchema),

  logout: (refreshToken: string) => publicPost("/tenants/logout", { refreshToken }, z.unknown()),

  /** Modifie le prénom et le nom du tenant connecté ; renvoie le profil à jour. */
  updateProfile: (tenantId: string, body: { firstName: string; lastName: string }) =>
    http<unknown>(`/tenants/${encodeURIComponent(tenantId)}`, { method: "PUT", body }).then(
      (data) => z.object({ user: tenantUserSchema }).parse(data).user,
    ),
};
