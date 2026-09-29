import { PageHeader } from "@/components/PageHeader";
import { AppForm, useAppActions } from "@/features/apps";
import { navigate } from "@/lib/router";
import { toast } from "@quickadui/overlays";

export default function AppCreatePage() {
  const { create } = useAppActions();

  return (
    <>
      <PageHeader
        title="Nouvelle application"
        description="Ses identifiants s'afficheront juste après la création."
      />
      <AppForm
        isSubmitting={create.isPending}
        error={create.error}
        onCancel={() => navigate("/apps")}
        onSubmit={(values) =>
          void create.run(values).then((created) => {
            if (!created) return;
            toast({ title: "Application créée", variant: "success" });
            navigate(`/apps/${encodeURIComponent(created.appId)}`, { replace: true });
          })
        }
      />
    </>
  );
}
