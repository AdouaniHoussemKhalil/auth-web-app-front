import { Spinner } from "@quickadui/core";
import { Flex } from "@quickadui/layout";
import { Suspense, useEffect } from "react";
import { HOME_PATH, LOGIN_PATH, notFoundPage as NotFoundPage, routes } from "@/app/routes";
import { AppShell } from "@/components/AppShell";
import { AuthLayout } from "@/components/AuthLayout";
import { PublicLayout } from "@/components/PublicLayout";
import { UserMenu, useAuth } from "@/features/auth";
import { matchPath, navigate, usePath } from "@/lib/router";

const Loading = ({ label }: { label: string }) => (
  <Flex justify="center" className="py-24">
    <Spinner label={label} />
  </Flex>
);

/** Redirige (sans entrée d'historique) puis n'affiche rien le temps du changement de hash. */
function Redirect({ to }: { to: string }) {
  useEffect(() => navigate(to, { replace: true }), [to]);
  return null;
}

export function App() {
  const path = usePath();
  const { status } = useAuth();

  if (status === "loading") return <Loading label="Restauration de la session" />;

  const match = routes
    .map((route) => ({ route, params: matchPath(route.path, path) }))
    .find(({ params }) => params !== null);

  if (match?.route.access === "guest") {
    if (status === "authenticated") return <Redirect to={HOME_PATH} />;
    const Page = match.route.page;
    return (
      <AuthLayout>
        <Suspense fallback={<Loading label="Chargement de la page" />}>
          <Page params={match.params ?? {}} />
        </Suspense>
      </AuthLayout>
    );
  }

  if (match?.route.access === "public" && status === "anonymous") {
    const Page = match.route.page;
    return (
      <PublicLayout>
        <Suspense fallback={<Loading label="Chargement de la page" />}>
          <Page params={match.params ?? {}} />
        </Suspense>
      </PublicLayout>
    );
  }

  // Route privée, publique avec session, ou inconnue : dans le shell (session requise).

  if (status === "anonymous") return <Redirect to={LOGIN_PATH} />;

  const Page = match?.route.page;
  return (
    <AppShell path={path} actions={<UserMenu />}>
      <Suspense fallback={<Loading label="Chargement de la page" />}>
        {Page ? <Page params={match.params ?? {}} /> : <NotFoundPage />}
      </Suspense>
    </AppShell>
  );
}
