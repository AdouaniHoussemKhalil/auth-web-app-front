import { Link } from "@/components/Link";
import { AuthCard, RegisterForm } from "@/features/auth";

export default function RegisterPage() {
  return (
    <AuthCard
      title="Créer un compte"
      footer={
        <>
          Déjà un compte ?&nbsp;
          <Link to="/login" className="text-accent-11 underline-offset-4 hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
