// API publique de la feature auth : seul point d'import depuis l'extérieur.
export { AuthProvider } from "./AuthProvider";
export type { AuthStatus } from "./authContext";
export { AuthCard } from "./components/AuthCard";
export { ForgotPasswordForm } from "./components/ForgotPasswordForm";
export { LoginForm } from "./components/LoginForm";
export { RegisterForm } from "./components/RegisterForm";
export { VerifyEmailForm } from "./components/VerifyEmailForm";
export { UserMenu } from "./components/UserMenu";
export { useAuth } from "./hooks/useAuth";
