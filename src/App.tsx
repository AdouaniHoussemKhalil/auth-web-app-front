import { Spinner } from "@quickadui/core";
import { Flex } from "@quickadui/layout";
import { Suspense } from "react";
import { notFoundPage as NotFoundPage, routes } from "@/app/routes";
import { AppShell } from "@/components/AppShell";
import { matchPath, usePath } from "@/lib/router";

const PageFallback = () => (
  <Flex justify="center" className="py-24">
    <Spinner label="Chargement de la page" />
  </Flex>
);

export function App() {
  const path = usePath();

  const match = routes
    .map((route) => ({ route, params: matchPath(route.path, path) }))
    .find(({ params }) => params !== null);
  const Page = match?.route.page;

  return (
    <AppShell path={path}>
      <Suspense fallback={<PageFallback />}>
        {Page ? <Page params={match.params ?? {}} /> : <NotFoundPage />}
      </Suspense>
    </AppShell>
  );
}
