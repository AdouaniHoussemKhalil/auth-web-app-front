import type { Consumer } from "@/api/consumers.api";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Link } from "@/components/Link";
import { ListPagination } from "@/components/ListPagination";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/StateMessages";
import { useApp } from "@/features/apps";
import {
  CONSUMERS_PAGE_SIZE,
  ConsumerDetailsDialog,
  ConsumersTable,
  useConsumerActions,
  useConsumers,
  type ConsumerAction,
} from "@/features/consumers";
import { navigate, useQueryParam, withQuery } from "@/lib/router";
import { Card, CardContent, Skeleton } from "@quickadui/core";
import { Input } from "@quickadui/forms";
import { SearchIcon } from "@quickadui/icons";
import { Stack } from "@quickadui/layout";
import { toast } from "@quickadui/overlays";
import { useEffect, useState } from "react";

const SEARCH_DELAY_MS = 300;

export default function AppUsersPage({ params }: { params: Record<string, string> }) {
  const appId = params.appId ?? "";
  const path = `/apps/${encodeURIComponent(appId)}/users`;

  // Recherche et page courante vivent dans l'URL : elles survivent au rechargement.
  const query = useQueryParam("q") ?? "";
  const page = Math.max(1, Number(useQueryParam("page")) || 1);
  const [search, setSearch] = useState(query);

  const { data: app } = useApp(appId);
  const { data, isLoading, error, reload, setData } = useConsumers(appId, page, query);
  const { setActive, remove } = useConsumerActions(appId);
  const [selected, setSelected] = useState<{ consumer: Consumer; action: ConsumerAction } | null>(
    null,
  );

  // La recherche part après une courte pause de frappe, et repart de la première page.
  useEffect(() => {
    const term = search.trim();
    if (term === query) return;
    const timer = setTimeout(
      () => navigate(term ? withQuery(path, { q: term }) : path, { replace: true }),
      SEARCH_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [search, query, path]);

  const goToPage = (next: number) =>
    navigate(withQuery(path, { ...(query && { q: query }), page: String(next) }));

  const changeStatus = async (consumer: Consumer, isActive: boolean) => {
    const updated = await setActive.run(consumer.id, isActive);
    if (!updated) return false;
    if (data) {
      setData({ ...data, data: data.data.map((c) => (c.id === updated.id ? updated : c)) });
    }
    toast({
      title: isActive ? "Utilisateur débloqué" : "Utilisateur bloqué",
      description: isActive ? undefined : "Toutes ses sessions ont été fermées.",
      variant: "success",
    });
    return true;
  };

  const onAction = (consumer: Consumer, action: ConsumerAction) => {
    if (action === "unblock") {
      void changeStatus(consumer, true).then((done) => {
        if (!done) toast({ title: "Déblocage impossible", variant: "danger" });
      });
      return;
    }
    setSelected({ consumer, action });
  };

  const deleteSelected = async () => {
    if (!selected) return false;
    const done = await remove.run(selected.consumer.id);
    if (done === undefined) return false;
    toast({ title: "Utilisateur supprimé", variant: "success" });
    // La page courante peut devenir vide : on revient à la précédente.
    if (data && data.data.length === 1 && page > 1) goToPage(page - 1);
    else reload();
    return true;
  };

  const close = (open: boolean) => {
    if (!open) setSelected(null);
  };

  return (
    <>
      <Link
        to={`/apps/${encodeURIComponent(appId)}`}
        className="text-sm text-neutral-11 hover:text-neutral-12"
      >
        ← {app?.name ?? "Application"}
      </Link>
      <PageHeader
        title="Utilisateurs"
        description="Les comptes créés par les utilisateurs de cette application."
      />

      <Stack gap="md">
        <Input
          type="search"
          aria-label="Rechercher par e-mail"
          placeholder="Rechercher par e-mail"
          startIcon={<SearchIcon />}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-sm"
        />

        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : isLoading && !data ? (
          <Card>
            <CardContent>
              <Stack gap="sm" aria-busy="true" aria-label="Chargement des utilisateurs">
                {Array.from({ length: 3 }, (_, index) => (
                  <Skeleton key={index} className="h-8 w-full" />
                ))}
              </Stack>
            </CardContent>
          </Card>
        ) : data && data.total === 0 ? (
          query ? (
            <EmptyState
              title="Aucun résultat"
              description={`Aucun utilisateur dont l'e-mail contient « ${query} ».`}
            />
          ) : (
            <EmptyState
              title="Aucun utilisateur"
              description="Les comptes apparaîtront ici dès que des utilisateurs s'inscriront sur votre application."
              action={
                <Link to="/docs" className="text-accent-11 underline-offset-4 hover:underline">
                  Voir comment brancher l'application
                </Link>
              }
            />
          )
        ) : data ? (
          <div>
            <Card>
              <CardContent className="p-0">
                <ConsumersTable consumers={data.data} onAction={onAction} />
              </CardContent>
            </Card>
            <ListPagination
              page={page}
              total={data.total}
              pageSize={CONSUMERS_PAGE_SIZE}
              onPageChange={goToPage}
            />
          </div>
        ) : null}
      </Stack>

      <ConsumerDetailsDialog
        consumer={selected?.action === "details" ? selected.consumer : null}
        onOpenChange={close}
      />
      <ConfirmDialog
        open={selected?.action === "block"}
        onOpenChange={close}
        title={`Bloquer ${selected?.consumer.email ?? ""} ?`}
        description="L'utilisateur sera déconnecté de tous ses appareils et ne pourra plus se connecter tant que vous ne l'aurez pas débloqué."
        confirmLabel="Bloquer"
        isPending={setActive.isPending}
        error={setActive.error}
        onConfirm={() =>
          selected ? changeStatus(selected.consumer, false) : Promise.resolve(false)
        }
      />
      <ConfirmDialog
        open={selected?.action === "delete"}
        onOpenChange={close}
        title={`Supprimer ${selected?.consumer.email ?? ""} ?`}
        description="Le compte et toutes ses données seront définitivement supprimés. L'utilisateur pourra se réinscrire avec la même adresse."
        confirmLabel="Supprimer"
        isPending={remove.isPending}
        error={remove.error}
        onConfirm={deleteSelected}
      />
    </>
  );
}
