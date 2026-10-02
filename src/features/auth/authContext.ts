import { createContext } from "react";
import type { AuthenticatedResponse, TenantUser } from "@/api/auth.api";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface AuthContextValue {
  status: AuthStatus;
  user: TenantUser | null;
  /** Ouvre la session après une vérification d'e-mail ou un code MFA valide. */
  openSession: (response: AuthenticatedResponse) => void;
  logout: () => Promise<void>;
  /** Remplace l'identité affichée (après une modification du profil). */
  updateUser: (user: TenantUser) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
