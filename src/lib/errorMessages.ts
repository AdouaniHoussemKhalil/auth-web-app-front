import { ApiError } from "./http";

// Codes d'erreur de l'API (README de auth-web-app-api, « Format des réponses d'erreur ») -> message pour l'utilisateur.
const MESSAGES: Record<string, string> = {
  networkError: "Impossible de joindre le serveur. Vérifiez votre connexion.",
  invalidCredentials: "E-mail ou mot de passe incorrect.",
  useGoogleSignIn: "Ce compte utilise la connexion Google.",
  UserBlocked: "Ce compte est désactivé.",
  emailNotVerified: "Votre adresse e-mail n'est pas encore vérifiée.",
  userAlreadyExists: "Un compte existe déjà avec cette adresse e-mail.",
  passwordMismatch: "Les mots de passe ne correspondent pas.",
  invalidCode: "Code incorrect.",
  expiredCode: "Ce code a expiré. Demandez-en un nouveau.",
  noPendingCode: "Aucun code en attente. Demandez-en un nouveau.",
  tooManyRequests: "Trop de tentatives. Réessayez dans quelques minutes.",
  validationError: "Certaines informations sont invalides.",
};

/** Message lisible pour une erreur d'appel à l'API. */
export const getErrorMessage = (error: unknown) =>
  (error instanceof ApiError && MESSAGES[error.code]) || "Une erreur inattendue est survenue.";
