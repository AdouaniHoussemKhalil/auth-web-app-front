import {
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
  type FieldValues,
  type FieldPath,
  type UseFormReturn,
} from "@quickadui/forms";
import { Grid, Stack } from "@quickadui/layout";

export interface VerificationFieldsProps<T extends FieldValues> {
  /** Formulaire contenant les champs emailVerificationMode, passwordResetMode et les URLs de vérification. */
  form: UseFormReturn<T>;
}

/** Mode code / lien de la vérification d'e-mail et du mot de passe oublié, avec les URLs du mode lien. */
export function VerificationFields<T extends FieldValues>({ form }: VerificationFieldsProps<T>) {
  const field = (name: string) => name as FieldPath<T>;
  const emailByLink = form.watch(field("emailVerificationMode")) === "link";
  const resetByLink = form.watch(field("passwordResetMode")) === "link";

  const modeSelect = (name: string, label: string, linkLabel: string, description: string) => (
    <FormField
      control={form.control}
      name={field(name)}
      render={({ field: input }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={input.value} onValueChange={input.onChange}>
            <FormControl>
              <SelectTrigger aria-label={label}>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="code">Code à 6 chiffres par e-mail</SelectItem>
              <SelectItem value="link">{linkLabel}</SelectItem>
            </SelectContent>
          </Select>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const urlField = (name: string, label: string, placeholder: string, description: string) => (
    <FormField
      control={form.control}
      name={field(name)}
      render={({ field: input }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...input}
              value={String(input.value ?? "")}
              type="url"
              placeholder={placeholder}
            />
          </FormControl>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Stack gap="md">
      <Grid className="grid-cols-1 gap-4 md:grid-cols-2">
        {modeSelect(
          "emailVerificationMode",
          "Vérification de l'e-mail",
          "Lien de confirmation par e-mail",
          emailByLink
            ? "Le lien passe par l'API, puis redirige vers vos pages de succès ou d'échec."
            : "L'utilisateur saisit le code dans votre application.",
        )}
        {modeSelect(
          "passwordResetMode",
          "Mot de passe oublié",
          "Lien vers votre page de réinitialisation",
          resetByLink
            ? "Le lien ouvre votre URL de réinitialisation avec ?token=…&email=…"
            : "L'utilisateur saisit le code, puis son nouveau mot de passe.",
        )}
      </Grid>
      {emailByLink && (
        <Grid className="grid-cols-1 gap-4 md:grid-cols-2">
          {urlField(
            "emailVerifiedUrl",
            "Page « adresse confirmée »",
            "https://app.exemple.com/email-verifie",
            "Ouverte après un lien valide.",
          )}
          {urlField(
            "emailVerificationFailedUrl",
            "Page « lien invalide »",
            "https://app.exemple.com/email-erreur",
            "Reçoit ?reason=expired ou ?reason=invalid ; proposez d'envoyer un nouveau lien.",
          )}
        </Grid>
      )}
    </Stack>
  );
}
