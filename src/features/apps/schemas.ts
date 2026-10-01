import { z } from "zod";

// Durées au format de l'API (librairie `ms`) : 15m, 1h, 7d…
const duration = z
  .string()
  .trim()
  .regex(/^\d+\s?(s|m|h|d)$/, "Format attendu : 15m, 1h, 7d…")
  .or(z.literal(""));

/** Client ID OAuth Google d'une application web. */
export const googleClientIdSchema = z
  .string()
  .trim()
  .regex(
    /^[\w-]+\.apps\.googleusercontent\.com$/,
    "Client ID Google attendu : …apps.googleusercontent.com",
  );

const optionalUrl = z.string().trim().url("URL invalide (https://…)").or(z.literal(""));

export const createAppSchema = z.object({
  name: z.string().trim().min(2, "2 caractères minimum"),
  redirectUrl: z.string().trim().url("URL invalide (https://…)"),
  resetPasswordUrl: z.string().trim().url("URL invalide (https://…)"),
  supportEmail: z.string().trim().email("Adresse e-mail invalide"),
  logoutUrl: optionalUrl,
  logoUrl: optionalUrl,
  primaryColor: z
    .string()
    .trim()
    .regex(/^#([0-9a-f]{3}){1,2}$/i, "Couleur hexadécimale (#2563eb)")
    .or(z.literal("")),
  tokenExpiresIn: duration,
  refreshTokenExpiresIn: duration,
  mfaVerificationMode: z.enum(["code", "link"]),
  mfaExpiresIn: duration,
  requireEmailVerification: z.boolean(),
  googleClientId: googleClientIdSchema.or(z.literal("")),
});

export type CreateAppValues = z.infer<typeof createAppSchema>;

/** Apparence des e-mails d'une application (modifiable après la création). */
export const emailBrandingSchema = z.object({
  name: z.string().trim().min(2, "2 caractères minimum"),
  logoUrl: optionalUrl,
  primaryColor: z
    .string()
    .trim()
    .regex(/^#([0-9a-f]{3}){1,2}$/i, "Couleur hexadécimale (#2563eb)")
    .or(z.literal("")),
  supportEmail: z.string().trim().email("Adresse e-mail invalide"),
});

export type EmailBrandingValues = z.infer<typeof emailBrandingSchema>;

export const createAppDefaults: CreateAppValues = {
  name: "",
  redirectUrl: "",
  resetPasswordUrl: "",
  supportEmail: "",
  logoutUrl: "",
  logoUrl: "",
  primaryColor: "",
  tokenExpiresIn: "1h",
  refreshTokenExpiresIn: "7d",
  mfaVerificationMode: "code",
  mfaExpiresIn: "15m",
  requireEmailVerification: false,
  googleClientId: "",
};

/** Retire les champs optionnels vides : l'API applique alors ses valeurs par défaut. */
export const toCreateAppBody = (values: CreateAppValues) =>
  Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== ""),
  ) as Partial<CreateAppValues> &
    Pick<CreateAppValues, "name" | "redirectUrl" | "resetPasswordUrl" | "supportEmail">;
