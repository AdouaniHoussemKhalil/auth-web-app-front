import { PageHeader } from "@/components/PageHeader";
import { ProfileForm } from "@/features/account";
import { useAuth } from "@/features/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@quickadui/core";

export default function ProfilePage() {
  const { user } = useAuth();
  // Page privée : l'application garantit une session ; garde-fou si elle vient d'être fermée.
  if (!user) return null;

  return (
    <>
      <PageHeader title="Mon profil" description="Informations de votre compte." />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Identité</CardTitle>
        </CardHeader>
        <CardContent>
          {/* key : repart des valeurs à jour si le profil change ailleurs (autre onglet). */}
          <ProfileForm key={`${user.firstName}-${user.lastName}`} user={user} />
        </CardContent>
      </Card>
    </>
  );
}
