import { FormError } from "@/components/FormError";
import { Button } from "@quickadui/core";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "@quickadui/overlays";
import { useState } from "react";

export interface RotateSecretDialogProps {
  appName: string;
  isPending: boolean;
  error: string | null;
  /** Doit renvoyer true si la rotation a réussi (la fenêtre se ferme alors). */
  onConfirm: () => Promise<boolean>;
}

/** Confirmation de la rotation du secret : l'action coupe toutes les sessions des utilisateurs de l'application. */
export function RotateSecretDialog({
  appName,
  isPending,
  error,
  onConfirm,
}: RotateSecretDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        <Button variant="outline">Régénérer le secret</Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Régénérer le secret de « {appName} » ?</ModalTitle>
          <ModalDescription>
            L'ancien secret cessera immédiatement de fonctionner et tous les utilisateurs de
            l'application seront déconnectés. Mettez à jour le secret dans votre back-end juste
            après.
          </ModalDescription>
        </ModalHeader>
        <FormError>{error}</FormError>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="ghost">Annuler</Button>
          </ModalClose>
          <Button
            variant="destructive"
            isLoading={isPending}
            onClick={() => void onConfirm().then((done) => done && setOpen(false))}
          >
            Régénérer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
