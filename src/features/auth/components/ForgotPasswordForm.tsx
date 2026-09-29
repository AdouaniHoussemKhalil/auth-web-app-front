import { authApi } from "@/api/auth.api";
import { FormError } from "@/components/FormError";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { navigate } from "@/lib/router";
import { Button } from "@/components/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  PasswordInput,
  useForm,
  zodResolver,
} from "@quickadui/forms";
import { Stack } from "@quickadui/layout";
import { toast } from "@quickadui/overlays";
import { useCallback, useState } from "react";
import {
  emailSchema,
  newPasswordSchema,
  passwordRules,
  type EmailValues,
  type NewPasswordValues,
} from "../schemas";
import { CodeForm } from "./CodeForm";

type Step =
  | { name: "email" }
  | { name: "code"; email: string }
  | { name: "password"; email: string; resetToken: string };

/**
 * Mot de passe oublié en trois étapes : e-mail → code reçu → nouveau mot de passe.
 * L'API révoque toutes les sessions après la réinitialisation.
 */
export function ForgotPasswordForm({ initialEmail }: { initialEmail?: string | undefined }) {
  const [step, setStep] = useState<Step>({ name: "email" });

  const sendCode = useAsyncAction(
    useCallback(async (email: string) => {
      await authApi.forgotPassword(email);
      setStep({ name: "code", email });
    }, []),
  );

  const verifyCode = useAsyncAction(
    useCallback(async (email: string, code: string) => {
      const { resetToken } = await authApi.verifyResetCode(email, code);
      setStep({ name: "password", email, resetToken });
    }, []),
  );

  const resetPassword = useAsyncAction(
    useCallback(async (email: string, resetToken: string, values: NewPasswordValues) => {
      await authApi.resetPassword({ email, resetToken, ...values });
      toast({
        title: "Mot de passe modifié",
        description: "Connectez-vous avec votre nouveau mot de passe.",
        variant: "success",
      });
      navigate("/login", { replace: true });
    }, []),
  );

  if (step.name === "code") {
    return (
      <CodeForm
        email={step.email}
        submitLabel="Valider le code"
        isSubmitting={verifyCode.isPending}
        error={verifyCode.error ?? sendCode.error}
        onSubmit={(code) => void verifyCode.run(step.email, code)}
        onResend={() => void sendCode.run(step.email)}
        isResending={sendCode.isPending}
      />
    );
  }

  if (step.name === "password") {
    return (
      <NewPasswordForm
        isSubmitting={resetPassword.isPending}
        error={resetPassword.error}
        onSubmit={(values) => void resetPassword.run(step.email, step.resetToken, values)}
      />
    );
  }

  return (
    <EmailStep
      initialEmail={initialEmail}
      isSubmitting={sendCode.isPending}
      error={sendCode.error}
      onSubmit={({ email }) => void sendCode.run(email)}
    />
  );
}

interface StepProps<T> {
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (values: T) => void;
}

function EmailStep({
  initialEmail,
  isSubmitting,
  error,
  onSubmit,
}: StepProps<EmailValues> & { initialEmail?: string | undefined }) {
  const form = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: initialEmail ?? "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Stack gap="md">
          <FormError>{error}</FormError>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse e-mail</FormLabel>
                <FormControl>
                  <Input {...field} type="email" autoComplete="email" autoFocus />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" isLoading={isSubmitting}>
            Recevoir un code
          </Button>
        </Stack>
      </form>
    </Form>
  );
}

function NewPasswordForm({ isSubmitting, error, onSubmit }: StepProps<NewPasswordValues>) {
  const form = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Stack gap="md">
          <FormError>{error}</FormError>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nouveau mot de passe</FormLabel>
                <FormControl>
                  <PasswordInput
                    {...field}
                    autoComplete="new-password"
                    autoFocus
                    showStrength
                    strengthRules={passwordRules}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmation du mot de passe</FormLabel>
                <FormControl>
                  <PasswordInput {...field} autoComplete="new-password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" isLoading={isSubmitting}>
            Changer mon mot de passe
          </Button>
        </Stack>
      </form>
    </Form>
  );
}
