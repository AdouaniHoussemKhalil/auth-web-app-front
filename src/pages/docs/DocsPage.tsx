import { Link } from "@/components/Link";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/features/auth";
import { GettingStartedGuide } from "@/features/docs";

const linkClass = "text-accent-11 underline-offset-4 hover:underline";

export default function DocsPage() {
  const { status } = useAuth();
  const signedIn = status === "authenticated";

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Comment commencer"
        description="Brancher l'authentification sur votre application, étape par étape."
      />
      <GettingStartedGuide
        accountLink={
          signedIn ? (
            <span>C'est déjà fait : vous êtes connecté.</span>
          ) : (
            <Link to="/register" className={linkClass}>
              Créer un compte
            </Link>
          )
        }
        appsLink={
          <Link to={signedIn ? "/apps" : "/login"} className={linkClass}>
            Applications
          </Link>
        }
      />
    </div>
  );
}
