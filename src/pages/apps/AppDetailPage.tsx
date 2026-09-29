import { Button } from "@/components/Button";
import { Link } from "@/components/Link";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/StateMessages";
import {
  AppCredentials,
  AppStatusBadge,
  GoogleClientIdForm,
  RotateSecretDialog,
  useApp,
  useAppActions,
} from "@/features/apps";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Typography,
} from "@quickadui/core";
import { Switch } from "@quickadui/forms";
import { Flex, Grid, Stack } from "@quickadui/layout";
import { toast } from "@quickadui/overlays";
import { navigate } from "@/lib/router";

const Setting = ({ label, value }: { label: string; value: string | undefined }) => (
  <div>
    <Typography variant="small" className="text-neutral-11">
      {label}
    </Typography>
    <Typography className="break-all">{value || "—"}</Typography>
  </div>
);

export default function AppDetailPage({ params }: { params: Record<string, string> }) {
  const appId = params.appId ?? "";
  const { data: app, isLoading, error, reload, setData } = useApp(appId);
  const { setActive, setGoogleClientId, rotateSecret } = useAppActions();

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (isLoading || !app) {
    return (
      <Stack gap="md" aria-busy="true" aria-label="Chargement de l'application">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </Stack>
    );
  }

  const toggleActive = async (isActive: boolean) => {
    const done = await setActive.run(app.id, isActive);
    if (done === undefined) return;
    setData({ ...app, isActive });
    toast({ title: isActive ? "Application activée" : "Application désactivée" });
  };

  const saveGoogleClientId = async (googleClientId: string | null) => {
    const done = await setGoogleClientId.run(app.id, googleClientId);
    if (done === undefined) return false;
    setData({ ...app, googleClientId: googleClientId ?? undefined });
    toast({
      title: googleClientId ? "Connexion Google activée" : "Connexion Google désactivée",
      variant: "success",
    });
    return true;
  };

  const rotate = async () => {
    const result = await rotateSecret.run(app.id);
    if (!result) return false;
    setData({ ...app, secretKey: result.secretKey });
    toast({
      title: "Nouveau secret généré",
      description: "Mettez-le à jour dans votre back-end.",
      variant: "success",
    });
    return true;
  };

  return (
    <>
      <Link to="/apps" className="text-sm text-neutral-11 hover:text-neutral-12">
        ← Applications
      </Link>
      <PageHeader title={app.name} actions={<AppStatusBadge isActive={app.isActive} />} />

      <Stack gap="lg">
        <Card>
          <CardHeader>
            <CardTitle>Identifiants</CardTitle>
            <CardDescription>
              À envoyer dans les en-têtes de chaque appel à /consumers/* depuis votre back-end.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Stack gap="md">
              <AppCredentials appId={app.id} secretKey={app.secretKey} />
              <Flex>
                <RotateSecretDialog
                  appName={app.name}
                  isPending={rotateSecret.isPending}
                  error={rotateSecret.error}
                  onConfirm={rotate}
                />
              </Flex>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs</CardTitle>
            <CardDescription>
              Consultez les comptes de l'application, bloquez ou supprimez un utilisateur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => navigate(`/apps/${encodeURIComponent(app.id)}/users`)}
            >
              Gérer les utilisateurs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connexion Google</CardTitle>
            <CardDescription>
              {app.googleClientId
                ? "Les utilisateurs peuvent se connecter avec Google (route /consumers/auth/google)."
                : "Désactivée. Renseignez le Client ID Google de votre application pour l'activer."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GoogleClientIdForm
              key={app.googleClientId ?? ""}
              value={app.googleClientId}
              isPending={setGoogleClientId.isPending}
              error={setGoogleClientId.error}
              onSave={saveGoogleClientId}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statut</CardTitle>
            <CardDescription>
              Une application désactivée refuse toutes les requêtes de ses utilisateurs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Flex align="center" gap="sm">
              <Switch
                id="app-active"
                checked={app.isActive}
                disabled={setActive.isPending}
                onCheckedChange={(checked) => void toggleActive(checked)}
              />
              <label htmlFor="app-active">Application active</label>
            </Flex>
            {setActive.error && (
              <Typography role="alert" className="mt-2 text-danger-11">
                {setActive.error}
              </Typography>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <Grid className="grid-cols-1 gap-4 md:grid-cols-2">
              <Setting label="URL de redirection" value={app.redirectUrl} />
              <Setting label="URL de réinitialisation" value={app.resetPasswordUrl} />
              <Setting label="URL de déconnexion" value={app.logoutUrl} />
              <Setting label="E-mail de support" value={app.branding?.supportEmail} />
              <Setting label="Access token" value={app.tokenExpiresIn} />
              <Setting label="Refresh token" value={app.refreshTokenExpiresIn} />
              <Setting
                label="Vérification MFA"
                value={
                  app.mfaSettings?.verificationMode === "link"
                    ? "Lien par e-mail"
                    : "Code à 6 chiffres par e-mail"
                }
              />
              <Setting
                label="Vérification de l'e-mail"
                value={app.requireEmailVerification ? "Obligatoire" : "Facultative"}
              />
            </Grid>
          </CardContent>
        </Card>
      </Stack>
    </>
  );
}
