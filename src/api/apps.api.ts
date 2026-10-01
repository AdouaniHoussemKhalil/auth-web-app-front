import { z } from "zod";
import { http } from "@/lib/http";

// Application cliente telle que renvoyée par l'API (seuls les champs utilisés par le front sont validés).
export const appClientSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  secretKey: z.string(),
  isActive: z.boolean(),
  redirectUrl: z.string(),
  resetPasswordUrl: z.string(),
  logoutUrl: z.string().optional(),
  tokenExpiresIn: z.string().optional(),
  refreshTokenExpiresIn: z.string().optional(),
  resetTokenExpiresIn: z.string().optional(),
  requireEmailVerification: z.boolean().optional(),
  googleClientId: z.string().optional(),
  emailVerificationMode: z.enum(["code", "link"]).optional(),
  passwordResetMode: z.enum(["code", "link"]).optional(),
  emailVerifiedUrl: z.string().optional(),
  emailVerificationFailedUrl: z.string().optional(),
  mfaSettings: z
    .object({ verificationMode: z.enum(["code", "link"]), expiryMinutes: z.number() })
    .partial()
    .optional(),
  branding: z
    .object({
      appName: z.string(),
      supportEmail: z.string(),
      logoUrl: z.string(),
      primaryColor: z.string(),
    })
    .partial()
    .optional(),
  createdAt: z.string(),
});

export type AppClient = z.infer<typeof appClientSchema>;

const pageSchema = z.object({
  data: z.array(appClientSchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
});

export type AppClientPage = z.infer<typeof pageSchema>;

/** Apparence des e-mails ; null retire le logo ou la couleur. */
export interface EmailBrandingBody {
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  supportEmail: string;
}

export interface CreateAppBody {
  name: string;
  redirectUrl: string;
  resetPasswordUrl: string;
  supportEmail: string;
  logoutUrl?: string | undefined;
  logoUrl?: string | undefined;
  primaryColor?: string | undefined;
  tokenExpiresIn?: string | undefined;
  refreshTokenExpiresIn?: string | undefined;
  mfaVerificationMode?: "code" | "link" | undefined;
  mfaExpiresIn?: string | undefined;
  requireEmailVerification?: boolean | undefined;
  googleClientId?: string | undefined;
  emailVerificationMode?: VerificationMode | undefined;
  passwordResetMode?: VerificationMode | undefined;
  emailVerifiedUrl?: string | undefined;
  emailVerificationFailedUrl?: string | undefined;
}

export type VerificationMode = "code" | "link";

/** URLs et réglages de vérification ; null retire une URL optionnelle. */
export interface AppSettingsBody {
  redirectUrl: string;
  resetPasswordUrl: string;
  logoutUrl: string | null;
  emailVerifiedUrl: string | null;
  emailVerificationFailedUrl: string | null;
  emailVerificationMode: VerificationMode;
  passwordResetMode: VerificationMode;
  mfaVerificationMode: VerificationMode;
  requireEmailVerification: boolean;
}

const base = (tenantId: string) => `/config/apps/${encodeURIComponent(tenantId)}`;

export const appsApi = {
  list: (tenantId: string, page: number, limit: number, signal?: AbortSignal) =>
    http<unknown>(base(tenantId), { query: { page, limit }, signal }).then((data) =>
      pageSchema.parse(data),
    ),

  get: (tenantId: string, appId: string, signal?: AbortSignal) =>
    http<unknown>(`${base(tenantId)}/${encodeURIComponent(appId)}`, { signal }).then((data) =>
      appClientSchema.parse(data),
    ),

  create: (tenantId: string, body: CreateAppBody) =>
    http<unknown>("/config/apps/create", { method: "POST", body: { tenantId, ...body } }).then(
      (data) => z.object({ data: z.object({ appId: z.string() }) }).parse(data).data,
    ),

  setActive: (tenantId: string, appId: string, isActive: boolean) =>
    http<unknown>(
      `/config/apps/update/${encodeURIComponent(tenantId)}/${encodeURIComponent(appId)}`,
      { method: "PUT", body: { isActive } },
    ),

  /** Client ID Google des utilisateurs de l'application ; null désactive la connexion Google. */
  setGoogleClientId: (tenantId: string, appId: string, googleClientId: string | null) =>
    http<unknown>(
      `/config/apps/update/${encodeURIComponent(tenantId)}/${encodeURIComponent(appId)}`,
      { method: "PUT", body: { googleClientId } },
    ),

  updateBranding: (tenantId: string, appId: string, body: EmailBrandingBody) =>
    http<unknown>(
      `/config/apps/update/${encodeURIComponent(tenantId)}/${encodeURIComponent(appId)}`,
      { method: "PUT", body },
    ),

  updateSettings: (tenantId: string, appId: string, body: AppSettingsBody) =>
    http<unknown>(
      `/config/apps/update/${encodeURIComponent(tenantId)}/${encodeURIComponent(appId)}`,
      { method: "PUT", body },
    ),

  /** Envoie au tenant connecté un e-mail d'exemple aux couleurs de l'application. */
  sendTestEmail: (tenantId: string, appId: string) =>
    http<unknown>(`${base(tenantId)}/${encodeURIComponent(appId)}/test-email`, {
      method: "POST",
    }).then((data) => z.object({ data: z.object({ to: z.string() }) }).parse(data).data),

  /** Nouveau secret ; les sessions des consumers de l'application sont révoquées par l'API. */
  rotateSecret: (tenantId: string, appId: string) =>
    http<unknown>(`${base(tenantId)}/${encodeURIComponent(appId)}/rotate-secret`, {
      method: "POST",
    }).then((data) => z.object({ data: z.object({ secretKey: z.string() }) }).parse(data).data),
};
