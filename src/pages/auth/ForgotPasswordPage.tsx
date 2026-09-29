import { Link } from "@/components/Link";
import { AuthCard, ForgotPasswordForm } from "@/features/auth";
import { useQueryParam } from "@/lib/router";

export default function ForgotPasswordPage() {
  const email = useQueryParam("email") ?? undefined;

  return (
    <AuthCard
      title="Mot de passe oublié"
      description="Recevez un code par e-mail pour choisir un nouveau mot de passe."
      footer={
        <Link to="/login" className="text-accent-11 underline-offset-4 hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      <ForgotPasswordForm initialEmail={email} />
    </AuthCard>
  );
}
