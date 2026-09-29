import { Link } from "@/components/Link";
import { AuthCard, VerifyEmailForm } from "@/features/auth";
import { useQueryParam } from "@/lib/router";
import { Typography } from "@quickadui/core";

export default function VerifyEmailPage() {
  const email = useQueryParam("email");

  if (!email) {
    return (
      <AuthCard title="Vérifier mon adresse">
        <Typography variant="muted">
          Adresse e-mail manquante.{" "}
          <Link to="/register" className="text-accent-11 underline">
            Recommencer l'inscription
          </Link>
        </Typography>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Vérifier mon adresse"
      description="Saisissez le code à 6 chiffres reçu par e-mail pour activer votre compte."
    >
      <VerifyEmailForm email={email} />
    </AuthCard>
  );
}
