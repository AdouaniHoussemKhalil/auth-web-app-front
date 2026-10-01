import { authApi } from "@/api/auth.api";
import { FormError } from "@/components/FormError";
import { Link } from "@/components/Link";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { navigate, withQuery } from "@/lib/router";
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
import { useCallback, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { loginSchema, type LoginValues } from "../schemas";
import { CodeForm } from "./CodeForm";
import { GoogleSignIn } from "./GoogleSignIn";

/**
 * Connexion en deux étapes : mot de passe (l'API envoie un code par e-mail), puis code MFA.
 * Les identifiants restent en mémoire le temps de l'étape 2, pour pouvoir renvoyer un code.
 */
export function LoginForm() {
  const { openSession } = useAuth();
  const [credentials, setCredentials] = useState<LoginValues | null>(null);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const sendCode = useAsyncAction(
    useCallback(async (values: LoginValues) => {
      await authApi.login(values.email, values.password);
      setCredentials(values);
    }, []),
  );

  const verifyCode = useAsyncAction(
    useCallback(
      async (code: string) => {
        if (!credentials) return;
        openSession(await authApi.loginByMFACode(credentials.email, code));
        navigate("/", { replace: true });
      },
      [credentials, openSession],
    ),
  );

  if (credentials) {
    return (
      <CodeForm
        email={credentials.email}
        submitLabel="Se connecter"
        isSubmitting={verifyCode.isPending}
        error={verifyCode.error ?? sendCode.error}
        onSubmit={(code) => void verifyCode.run(code)}
        onResend={() => void sendCode.run(credentials)}
        isResending={sendCode.isPending}
      />
    );
  }

  const email = form.watch("email");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => void sendCode.run(values))} noValidate>
        <Stack gap="md">
          {sendCode.error && (
            <FormError>
              {sendCode.error}
              {sendCode.errorCode === "emailNotVerified" && email && (
                <>
                  {" "}
                  <Link to={withQuery("/verify-email", { email })} className="underline">
                    Vérifier mon adresse
                  </Link>
                </>
              )}
            </FormError>
          )}
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <PasswordInput {...field} autoComplete="current-password" />
                </FormControl>
                <FormMessage />
                <Link
                  to={email ? withQuery("/forgot-password", { email }) : "/forgot-password"}
                  className="text-sm text-accent-11 underline-offset-4 hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </FormItem>
            )}
          />
          <Button type="submit" isLoading={sendCode.isPending}>
            Continuer
          </Button>
        </Stack>
      </form>
      <GoogleSignIn />
    </Form>
  );
}
