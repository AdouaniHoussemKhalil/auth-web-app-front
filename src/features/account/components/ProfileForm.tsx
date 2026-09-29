import type { TenantUser } from "@/api/auth.api";
import { Button } from "@/components/Button";
import { Typography } from "@quickadui/core";
import { FormError } from "@/components/FormError";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Label,
  useForm,
  zodResolver,
} from "@quickadui/forms";
import { Flex, Grid, Stack } from "@quickadui/layout";
import { toast } from "@quickadui/overlays";
import { useUpdateProfile } from "../hooks/useUpdateProfile";
import { profileSchema, type ProfileValues } from "../schemas";

/** Prénom et nom modifiables ; l'e-mail est affiché en lecture seule (son changement n'est pas encore géré). */
export function ProfileForm({ user }: { user: TenantUser }) {
  const update = useUpdateProfile();
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user.firstName, lastName: user.lastName },
  });

  const onSubmit = async (values: ProfileValues) => {
    const updated = await update.run(values);
    if (!updated) return;
    // Le formulaire repart des valeurs enregistrées : le bouton redevient inactif.
    form.reset({ firstName: updated.firstName, lastName: updated.lastName });
    toast({ title: "Profil mis à jour", variant: "success" });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Stack gap="md">
          <FormError>{update.error}</FormError>
          <Grid className="grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="given-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="family-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Grid>
          <Stack gap="xs">
            <Label htmlFor="profile-email">Adresse e-mail</Label>
            <Input id="profile-email" value={user.email} readOnly disabled />
            {/* Hors FormField : FormDescription exigerait le contexte d'un champ du formulaire. */}
            <Typography variant="muted" className="text-sm">
              L'adresse e-mail ne peut pas encore être modifiée.
            </Typography>
          </Stack>
          <Flex justify="end">
            <Button type="submit" isLoading={update.isPending} disabled={!form.formState.isDirty}>
              Enregistrer
            </Button>
          </Flex>
        </Stack>
      </form>
    </Form>
  );
}
