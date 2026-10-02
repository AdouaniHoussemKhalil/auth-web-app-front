import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@quickadui/core";
import { Grid } from "@quickadui/layout";
import { PageHeader } from "@/components/PageHeader";
import { Link } from "@/components/Link";

export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Gérez vos applications clientes et l'authentification de leurs utilisateurs."
      />
      <Grid className="grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>
              Déclarez une application pour obtenir ses identifiants x-app-id / x-app-secret.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/apps" className="text-accent-11 underline-offset-4 hover:underline">
              Voir mes applications
            </Link>
          </CardContent>
        </Card>
      </Grid>
    </>
  );
}
