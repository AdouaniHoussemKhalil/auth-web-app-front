import { FormError } from "@/components/FormError";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@quickadui/core";
import { Button } from "@/components/Button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  type FieldPath,
  useForm,
  zodResolver,
} from "@quickadui/forms";
import { Flex, Grid, Stack } from "@quickadui/layout";
import type { ReactNode } from "react";
import { createAppDefaults, createAppSchema, type CreateAppValues } from "../schemas";
import { VerificationFields } from "./VerificationFields";

export interface AppFormProps {
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (values: CreateAppValues) => void;
  onCancel: () => void;
}

/** Création d'une application : informations obligatoires, puis réglages avancés pré-remplis. */
export function AppForm({ isSubmitting, error, onSubmit, onCancel }: AppFormProps) {
  const form = useForm<CreateAppValues>({
    resolver: zodResolver(createAppSchema),
    defaultValues: createAppDefaults,
  });

  const textField = (
    name: FieldPath<CreateAppValues>,
    label: string,
    options: { description?: ReactNode; placeholder?: string; type?: string } = {},
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              value={String(field.value ?? "")}
              type={options.type ?? "text"}
              placeholder={options.placeholder}
            />
          </FormControl>
          {options.description && <FormDescription>{options.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Stack gap="lg">
          <FormError>{error}</FormError>

          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
              <CardDescription>
                Les URLs pointent vers le front de votre application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Stack gap="md">
                {textField("name", "Nom", { placeholder: "Mon application" })}
                <Grid className="grid-cols-1 gap-4 md:grid-cols-2">
                  {textField("redirectUrl", "URL de redirection", {
                    placeholder: "https://app.exemple.com",
                    type: "url",
                  })}
                  {textField("resetPasswordUrl", "URL de réinitialisation du mot de passe", {
                    placeholder: "https://app.exemple.com/reset",
                    type: "url",
                  })}
                  {textField("supportEmail", "E-mail de support", {
                    placeholder: "support@exemple.com",
                    type: "email",
                  })}
                  {textField("logoutUrl", "URL de déconnexion (optionnel)", { type: "url" })}
                </Grid>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sécurité</CardTitle>
              <CardDescription>Durées au format 15m, 1h, 7d.</CardDescription>
            </CardHeader>
            <CardContent>
              <Stack gap="md">
                <Grid className="grid-cols-1 gap-4 md:grid-cols-3">
                  {textField("tokenExpiresIn", "Durée de l'access token")}
                  {textField("refreshTokenExpiresIn", "Durée du refresh token")}
                  {textField("mfaExpiresIn", "Durée des demandes MFA")}
                </Grid>
                <FormField
                  control={form.control}
                  name="mfaVerificationMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vérification MFA</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="md:w-80">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="code">Code à 6 chiffres par e-mail</SelectItem>
                          <SelectItem value="link">Lien par e-mail</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requireEmailVerification"
                  render={({ field }) => (
                    <FormItem>
                      <Flex align="center" gap="sm">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel>Exiger la vérification de l'e-mail avant la connexion</FormLabel>
                      </Flex>
                      <FormDescription>
                        Les utilisateurs ne pourront pas se connecter tant qu'ils n'auront pas
                        confirmé leur adresse.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <VerificationFields form={form} />
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connexion Google (optionnel)</CardTitle>
              <CardDescription>
                Permet aux utilisateurs de l'application de se connecter avec leur compte Google.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {textField("googleClientId", "Client ID Google", {
                placeholder: "1234-abcd.apps.googleusercontent.com",
                description:
                  "Le Client ID OAuth « Application Web » de votre projet Google Cloud, celui utilisé par le bouton Google de votre front.",
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Apparence des e-mails (optionnel)</CardTitle>
            </CardHeader>
            <CardContent>
              <Grid className="grid-cols-1 gap-4 md:grid-cols-2">
                {textField("logoUrl", "URL du logo", { type: "url" })}
                {textField("primaryColor", "Couleur principale", { placeholder: "#2563eb" })}
              </Grid>
            </CardContent>
          </Card>

          <Flex justify="end" gap="sm">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Créer l'application
            </Button>
          </Flex>
        </Stack>
      </form>
    </Form>
  );
}
