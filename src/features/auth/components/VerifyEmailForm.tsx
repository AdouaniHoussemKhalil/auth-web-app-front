import { authApi } from "@/api/auth.api";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { navigate } from "@/lib/router";
import { toast } from "@quickadui/overlays";
import { useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { CodeForm } from "./CodeForm";

/** Vérification de l'e-mail après l'inscription : un code valide ouvre directement la session. */
export function VerifyEmailForm({ email }: { email: string }) {
  const { openSession } = useAuth();

  const verify = useAsyncAction(
    useCallback(
      async (code: string) => {
        openSession(await authApi.verifyEmail(email, code));
        toast({ title: "Adresse e-mail vérifiée", variant: "success" });
        navigate("/", { replace: true });
      },
      [email, openSession],
    ),
  );

  const resend = useAsyncAction(
    useCallback(async () => {
      await authApi.resendEmailVerification(email);
      toast({ title: "Un nouveau code a été envoyé", description: email });
    }, [email]),
  );

  return (
    <CodeForm
      email={email}
      submitLabel="Vérifier mon adresse"
      isSubmitting={verify.isPending}
      error={verify.error ?? resend.error}
      onSubmit={(code) => void verify.run(code)}
      onResend={() => void resend.run()}
      isResending={resend.isPending}
    />
  );
}
