import { Button } from "@/components/Button";
import { FormError } from "@/components/FormError";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@quickadui/overlays";
import type { ReactNode } from "react";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  isPending: boolean;
  error: string | null;
  /** Doit renvoyer true si l'action a réussi (la fenêtre se ferme alors). */
  onConfirm: () => Promise<boolean>;
}

/** Confirmation d'une action destructrice ou difficile à annuler. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  isPending,
  error,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <ModalDescription>{description}</ModalDescription>
        </ModalHeader>
        <FormError>{error}</FormError>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="ghost">Annuler</Button>
          </ModalClose>
          <Button
            variant="destructive"
            isLoading={isPending}
            onClick={() => void onConfirm().then((done) => done && onOpenChange(false))}
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
