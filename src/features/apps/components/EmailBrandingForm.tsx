import { Button } from "@/components/Button";
import { FormError } from "@/components/FormError";
import { Typography } from "@quickadui/core";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  useForm,
  zodResolver,
} from "@quickadui/forms";
import { Flex, Grid, Stack } from "@quickadui/layout";
import { emailBrandingSchema, type EmailBrandingValues } from "../schemas";

// Couleur des e-mails sans couleur principale (voir l'API, services/email/branding.ts).
const DEFAULT_EMAIL_COLOR = "#1F1E1D";
const isHexColor = (value: string) => /^#([0-9a-f]{3}){1,2}$/i.test(value);
const toSixDigits = (value: string) =>
  value.length === 4 ? `#${[...value.slice(1)].map((c) => c + c).join("")}` : value;

export interface EmailBrandingFormProps {
  defaultValues: EmailBrandingValues;
  isSaving: boolean;
  saveError: string | null;
  /** Doit renvoyer true si l'enregistrement a réussi. */
  onSave: (values: EmailBrandingValues) => Promise<boolean>;
  isSendingTest: boolean;
  testError: string | null;
  onSendTest: () => void;
}

/** Nom, logo, couleur et e-mail de support des e-mails d'une application, avec un aperçu. */
export function EmailBrandingForm({
  defaultValues,
  isSaving,
  saveError,
  onSave,
  isSendingTest,
  testError,
  onSendTest,
}: EmailBrandingFormProps) {
  const form = useForm<EmailBrandingValues>({
    resolver: zodResolver(emailBrandingSchema),
    defaultValues,
  });
  const values = form.watch();
  const color = isHexColor(values.primaryColor) ? values.primaryColor : DEFAULT_EMAIL_COLOR;
  const isDirty = form.formState.isDirty;

  const save = form.handleSubmit(async (submitted) => {
    if (await onSave(submitted)) form.reset(submitted);
  });

  return (
    <Form {...form}>
      <form onSubmit={save} noValidate>
        <Stack gap="md">
          <Grid className="grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom affiché</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>Expéditeur, objet et texte des e-mails.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="supportEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail de support</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormDescription>Affiché en bas de chaque e-mail.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL du logo</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" placeholder="https://exemple.com/logo.png" />
                  </FormControl>
                  <FormDescription>
                    Image PNG ou JPG publique, 40 px de haut. Vide : le nom.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Couleur principale</FormLabel>
                  <Flex gap="sm" align="center">
                    <input
                      type="color"
                      aria-label="Choisir la couleur principale"
                      value={toSixDigits(color)}
                      onChange={(event) =>
                        form.setValue("primaryColor", event.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      className="h-9 w-12 shrink-0 cursor-pointer rounded border border-neutral-6 bg-neutral-1 p-1"
                    />
                    <FormControl>
                      <Input {...field} placeholder="#2563eb" />
                    </FormControl>
                  </Flex>
                  <FormDescription>
                    Bandeau, bloc du code et boutons. Vide : neutre.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Grid>

          {/* Aperçu : reprend la mise en page des e-mails (en-tête, bandeau, bloc du code). */}
          <div
            aria-label="Aperçu de l'e-mail"
            role="img"
            className="rounded-lg border border-neutral-6 bg-neutral-2 p-4"
          >
            <div className="mb-3 h-8">
              {values.logoUrl ? (
                <img src={values.logoUrl} alt="" className="h-8 max-w-40 object-contain" />
              ) : (
                <Typography as="span" className="font-bold">
                  {values.name || "Application"}
                </Typography>
              )}
            </div>
            <div
              className="rounded-md border-t-4 bg-neutral-1 p-4"
              style={{ borderTopColor: color }}
            >
              <Typography variant="small" className="mb-2 block font-semibold">
                Votre code de connexion
              </Typography>
              <div
                className="rounded-md border py-2 text-center font-mono text-lg font-bold tracking-[0.4em]"
                style={{ borderColor: color }}
              >
                123456
              </div>
            </div>
          </div>

          <FormError>{saveError ?? testError}</FormError>
          <Flex gap="sm" wrap="wrap" align="center">
            <Button type="submit" variant="outline" isLoading={isSaving} disabled={!isDirty}>
              Enregistrer l'apparence
            </Button>
            <Button
              type="button"
              variant="ghost"
              isLoading={isSendingTest}
              disabled={isDirty}
              onClick={onSendTest}
            >
              Envoyer un e-mail de test
            </Button>
            {isDirty && (
              <Typography variant="muted" className="text-sm">
                Enregistrez avant d'envoyer un e-mail de test.
              </Typography>
            )}
          </Flex>
        </Stack>
      </form>
    </Form>
  );
}
