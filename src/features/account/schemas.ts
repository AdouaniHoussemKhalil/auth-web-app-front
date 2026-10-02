import { z } from "zod";

// Mêmes règles que l'API (inscription et modification du profil).
export const profileSchema = z.object({
  firstName: z.string().trim().min(3, "3 caractères minimum"),
  lastName: z.string().trim().min(3, "3 caractères minimum"),
});

export type ProfileValues = z.infer<typeof profileSchema>;
