import { Link } from "@/components/Link";
import { AuthCard, LoginForm } from "@/features/auth";

export default function LoginPage() {
  return (
    <AuthCard
      title="Connexion"
      description="Un code de vérification vous sera envoyé par e-mail."
      footer={
        <>
          Pas encore de compte ?&nbsp;
          <Link to="/register" className="text-accent-11 underline-offset-4 hover:underline">
            Créer un compte
          </Link>
          &nbsp;·&nbsp;
          <Link to="/docs" className="text-accent-11 underline-offset-4 hover:underline">
            Comment commencer
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
