import { ListPagination } from "@/components/ListPagination";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/StateMessages";
import { APPS_PAGE_SIZE, AppsTable, useApps } from "@/features/apps";
import { navigate, useQueryParam, withQuery } from "@/lib/router";
import { Button, Card, CardContent, Skeleton } from "@quickadui/core";
import { PlusIcon } from "@quickadui/icons";
import { Stack } from "@quickadui/layout";

const NewAppButton = () => (
  <Button icon={<PlusIcon />} onClick={() => navigate("/apps/new")}>
    Nouvelle application
  </Button>
);

export default function AppsListPage() {
  // La page courante vit dans l'URL : elle survit au rechargement et au retour arrière.
  const page = Math.max(1, Number(useQueryParam("page")) || 1);
  const { data, isLoading, error, reload } = useApps(page);

  return (
    <>
      <PageHeader
        title="Applications"
        description="Chaque application reçoit ses propres identifiants et ses propres utilisateurs."
        actions={<NewAppButton />}
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : isLoading && !data ? (
        <Card>
          <CardContent>
            <Stack gap="sm" aria-busy="true" aria-label="Chargement des applications">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </Stack>
          </CardContent>
        </Card>
      ) : data && data.total === 0 ? (
        <EmptyState
          title="Aucune application"
          description="Créez votre première application pour obtenir ses identifiants."
          action={<NewAppButton />}
        />
      ) : data ? (
        <>
          <Card>
            <CardContent className="p-0">
              <AppsTable apps={data.data} />
            </CardContent>
          </Card>
          <ListPagination
            page={page}
            total={data.total}
            pageSize={APPS_PAGE_SIZE}
            onPageChange={(next) => navigate(withQuery("/apps", { page: String(next) }))}
          />
        </>
      ) : null}
    </>
  );
}
