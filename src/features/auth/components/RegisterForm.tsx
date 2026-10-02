import { authApi } from "@/api/auth.api";
import { FormError } from "@/components/FormError";
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
import { Grid, Stack } from "@quickadui/layout";
import { useCallback } from "react";
import { passwordRules, registerSchema, type RegisterValues } from "../schemas";
import { GoogleSignIn } from "./GoogleSignIn";

/** Inscription : aucune session n'est ouverte, l'utilisateur est envoyé vers la vérification de son e-mail. */
export function RegisterForm() {
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  const register = useAsyncAction(
    useCallback(async (values: RegisterValues) => {
      const { email } = await authApi.register(values);
      navigate(withQuery("/verify-email", { email }));
    }, []),
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => void register.run(values))} noValidate>
        <Stack gap="md">
          <FormError>{register.error}</FormError>
          <Grid className="grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="given-name" autoFocus />
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
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse e-mail</FormLabel>
                <FormControl>
                  <Input {...field} type="email" autoComplete="email" />
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
                  <PasswordInput
                    {...field}
                    autoComplete="new-password"
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
          <Button type="submit" isLoading={register.isPending}>
            Créer mon compte
          </Button>
        </Stack>
      </form>
      <GoogleSignIn />
    </Form>
  );
}
