import { Button } from "@/components/Button";
import { FormError } from "@/components/FormError";
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
import { appSettingsSchema, type AppSettingsValues } from "../schemas";
import { VerificationFields } from "./VerificationFields";

export interface AppSettingsFormProps {
  defaultValues: AppSettingsValues;
  isSaving: boolean;
  error: string | null;
  /** Doit renvoyer true si l'enregistrement a réussi. */
  onSave: (values: AppSettingsValues) => Promise<boolean>;
}

/** URLs du front de l'application et réglages de vérification, modifiables après la création. */
export function AppSettingsForm({ defaultValues, isSaving, error, onSave }: AppSettingsFormProps) {
  const form = useForm<AppSettingsValues>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues,
  });

  const save = form.handleSubmit(async (values) => {
    if (await onSave(values)) form.reset(values);
  });

  const urlField = (name: FieldPath<AppSettingsValues>, label: string, description: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} value={String(field.value ?? "")} type="url" />
          </FormControl>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={save} noValidate>
        <Stack gap="md">
          <Grid className="grid-cols-1 gap-4 md:grid-cols-2">
            {urlField(
              "redirectUrl",
              "URL de redirection",
              "Base des liens MFA en mode lien (/auth/MFA/activate…).",
            )}
            {urlField(
              "resetPasswordUrl",
              "URL de réinitialisation",
              "Page « nouveau mot de passe » ouverte par le lien de réinitialisation.",
            )}
            {urlField("logoutUrl", "URL de déconnexion (optionnel)", "Vide : aucune.")}
            <FormField
              control={form.control}
              name="mfaVerificationMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activation du MFA</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger aria-label="Activation du MFA">
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
          </Grid>

          <VerificationFields form={form} />

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
              </FormItem>
            )}
          />

          <FormError>{error}</FormError>
          <Flex>
            <Button
              type="submit"
              variant="outline"
              isLoading={isSaving}
              disabled={!form.formState.isDirty}
            >
              Enregistrer les réglages
            </Button>
          </Flex>
        </Stack>
      </form>
    </Form>
  );
}
