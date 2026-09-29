import type { PasswordRule } from "@quickadui/forms";
import { z } from "zod";

/**
 * Règles de mot de passe de l'API (src/validation/users/passwordSchema.ts côté API).
 * Source unique : utilisées par la validation zod ET par l'indicateur de robustesse du formulaire.
 */
export const passwordRules: PasswordRule[] = [
  { id: "length", label: "8 caractères minimum", test: (value) => value.length >= 8 },
  { id: "lowercase", label: "Une minuscule", test: (value) => /[a-z]/.test(value) },
  { id: "uppercase", label: "Une majuscule", test: (value) => /[A-Z]/.test(value) },
  { id: "number", label: "Un chiffre", test: (value) => /[0-9]/.test(value) },
  {
    id: "symbol",
    label: 'Un caractère spécial parmi !@#$%^&*(),.?":{}|<>',
    test: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
  },
];

const passwordSchema = passwordRules.reduce(
  (schema, rule) => schema.refine(rule.test, { message: rule.label }),
  z.string(),
);

const email = z
  .string()
  .trim()
  .min(1, "L'adresse e-mail est obligatoire")
  .email("Adresse e-mail invalide");
const code = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Le code contient 6 chiffres");

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(3, "3 caractères minimum"),
    lastName: z.string().trim().min(3, "3 caractères minimum"),
    email,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Le mot de passe est obligatoire"),
});

export const codeSchema = z.object({ code });

export type RegisterValues = z.infer<typeof registerSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type CodeValues = z.infer<typeof codeSchema>;
