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
  useForm,
  zodResolver,
} from "@quickadui/forms";
import { Flex, Stack } from "@quickadui/layout";
import { z } from "zod";
import { googleClientIdSchema } from "../schemas";

const schema = z.object({ googleClientId: googleClientIdSchema });

export interface GoogleClientIdFormProps {
  /** Client ID enregistré ; absent : connexion Google désactivée. */
  value: string | undefined;
  isPending: boolean;
  error: string | null;
  /** null retire le Client ID. Doit renvoyer true en cas de succès. */
  onSave: (googleClientId: string | null) => Promise<boolean>;
}

/** Client ID Google des utilisateurs d'une application : définir, modifier ou retirer. */
export function GoogleClientIdForm({ value, isPending, error, onSave }: GoogleClientIdFormProps) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { googleClientId: value ?? "" },
  });

  const save = form.handleSubmit(async ({ googleClientId }) => {
    if (await onSave(googleClientId)) form.reset({ googleClientId });
  });

  const clear = async () => {
    if (await onSave(null)) form.reset({ googleClientId: "" });
  };

  return (
    <Form {...form}>
      <form onSubmit={save} noValidate>
        <Stack gap="md">
          <FormField
            control={form.control}
            name="googleClientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client ID Google</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="1234-abcd.apps.googleusercontent.com" />
                </FormControl>
                <FormDescription>
                  Le Client ID OAuth « Application Web » utilisé par le bouton Google de votre
                  front.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormError>{error}</FormError>
          <Flex gap="sm">
            <Button type="submit" variant="outline" isLoading={isPending}>
              Enregistrer
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                onClick={() => void clear()}
              >
                Désactiver la connexion Google
              </Button>
            )}
          </Flex>
        </Stack>
      </form>
    </Form>
  );
}
