import { Button } from "@/components/Button";
import { Link } from "@/components/Link";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/StateMessages";
import {
  AppCredentials,
  AppSettingsForm,
  AppStatusBadge,
  EmailBrandingForm,
  GoogleClientIdForm,
  type AppSettingsValues,
  type EmailBrandingValues,
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
  const {
    setActive,
    setGoogleClientId,
    updateBranding,
    updateSettings,
    sendTestEmail,
    rotateSecret,
  } = useAppActions();

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

  const saveBranding = async (values: EmailBrandingValues) => {
    const done = await updateBranding.run(app.id, values);
    if (done === undefined) return false;
    setData({
      ...app,
      name: values.name,
      branding: {
        ...app.branding,
        appName: values.name,
        supportEmail: values.supportEmail,
        logoUrl: values.logoUrl || undefined,
        primaryColor: values.primaryColor || undefined,
      },
    });
    toast({ title: "Apparence des e-mails enregistrée", variant: "success" });
    return true;
  };

  const saveSettings = async (values: AppSettingsValues) => {
    const done = await updateSettings.run(app.id, values);
    if (done === undefined) return false;
    setData({
      ...app,
      redirectUrl: values.redirectUrl,
      resetPasswordUrl: values.resetPasswordUrl,
      logoutUrl: values.logoutUrl || undefined,
      emailVerifiedUrl: values.emailVerifiedUrl || undefined,
      emailVerificationFailedUrl: values.emailVerificationFailedUrl || undefined,
      emailVerificationMode: values.emailVerificationMode,
      passwordResetMode: values.passwordResetMode,
      requireEmailVerification: values.requireEmailVerification,
      mfaSettings: { ...app.mfaSettings, verificationMode: values.mfaVerificationMode },
    });
    toast({ title: "Réglages enregistrés", variant: "success" });
    return true;
  };

  const testEmail = async () => {
    const result = await sendTestEmail.run(app.id);
    if (result) toast({ title: `E-mail de test envoyé à ${result.to}`, variant: "success" });
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
            <CardTitle>Apparence des e-mails</CardTitle>
            <CardDescription>
              Les e-mails envoyés aux utilisateurs (codes, mot de passe oublié…) reprennent ce nom,
              ce logo et cette couleur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailBrandingForm
              defaultValues={{
                name: app.branding?.appName || app.name,
                supportEmail: app.branding?.supportEmail ?? "",
                logoUrl: app.branding?.logoUrl ?? "",
                // Les anciennes applications ont #RRGGBBAA : le champ attend #RRGGBB.
                primaryColor: (app.branding?.primaryColor ?? "").slice(0, 7),
              }}
              isSaving={updateBranding.isPending}
              saveError={updateBranding.error}
              onSave={saveBranding}
              isSendingTest={sendTestEmail.isPending}
              testError={sendTestEmail.error}
              onSendTest={() => void testEmail()}
            />
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
            <CardTitle>URLs et vérification</CardTitle>
            <CardDescription>
              Pages de votre application vers lesquelles pointent les e-mails, et mode de
              vérification : code à saisir ou lien.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppSettingsForm
              defaultValues={{
                redirectUrl: app.redirectUrl,
                resetPasswordUrl: app.resetPasswordUrl,
                logoutUrl: app.logoutUrl ?? "",
                emailVerifiedUrl: app.emailVerifiedUrl ?? "",
                emailVerificationFailedUrl: app.emailVerificationFailedUrl ?? "",
                emailVerificationMode: app.emailVerificationMode ?? "code",
                passwordResetMode: app.passwordResetMode ?? "code",
                mfaVerificationMode: app.mfaSettings?.verificationMode ?? "code",
                requireEmailVerification: app.requireEmailVerification ?? false,
              }}
              isSaving={updateSettings.isPending}
              error={updateSettings.error}
              onSave={saveSettings}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Durées des sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <Grid className="grid-cols-1 gap-4 md:grid-cols-2">
              <Setting label="Access token" value={app.tokenExpiresIn} />
              <Setting label="Refresh token" value={app.refreshTokenExpiresIn} />
            </Grid>
          </CardContent>
        </Card>
      </Stack>
    </>
  );
}
