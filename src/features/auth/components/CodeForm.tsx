import { Button } from "@quickadui/core";
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
import { Stack } from "@quickadui/layout";
import { codeSchema, type CodeValues } from "../schemas";
import { FormError } from "@/components/FormError";

export interface CodeFormProps {
  /** Adresse à laquelle le code a été envoyé, rappelée à l'utilisateur. */
  email: string;
  submitLabel: string;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (code: string) => void;
  onResend: () => void;
  isResending?: boolean | undefined;
}

/** Saisie d'un code à 6 chiffres reçu par e-mail (vérification d'e-mail, connexion MFA). */
export function CodeForm({
  email,
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
  onResend,
  isResending,
}: CodeFormProps) {
  const form = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(({ code }) => onSubmit(code))} noValidate>
        <Stack gap="md">
          <FormError>{error}</FormError>
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code reçu par e-mail</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="123456"
                    autoFocus
                  />
                </FormControl>
                <FormDescription>Envoyé à {email}. Pensez à vérifier vos spams.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" isLoading={isSubmitting}>
            {submitLabel}
          </Button>
          <Button type="button" variant="ghost" onClick={onResend} isLoading={isResending}>
            Renvoyer un code
          </Button>
        </Stack>
      </form>
    </Form>
  );
}
