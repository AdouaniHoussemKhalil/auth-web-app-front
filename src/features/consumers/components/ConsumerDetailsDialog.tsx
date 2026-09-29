import type { Consumer } from "@/api/consumers.api";
import { Typography } from "@quickadui/core";
import { Grid } from "@quickadui/layout";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@quickadui/overlays";
import type { ReactNode } from "react";
import { ConsumerStatusBadge } from "./ConsumerBadges";
import { dateFormat } from "../format";

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <Typography variant="small" className="text-neutral-11">
      {label}
    </Typography>
    <div className="break-all">{children}</div>
  </div>
);

const yesNo = (value: boolean | undefined) => (value ? "Oui" : "Non");

export interface ConsumerDetailsDialogProps {
  consumer: Consumer | null;
  onOpenChange: (open: boolean) => void;
}

/** Fiche d'un utilisateur : identité, méthode de connexion et sécurité du compte. */
export function ConsumerDetailsDialog({ consumer, onOpenChange }: ConsumerDetailsDialogProps) {
  return (
    <Modal open={consumer !== null} onOpenChange={onOpenChange}>
      <ModalContent>
        {consumer && (
          <>
            <ModalHeader>
              <ModalTitle>
                {consumer.firstName} {consumer.lastName}
              </ModalTitle>
              <ModalDescription>{consumer.email}</ModalDescription>
            </ModalHeader>
            <Grid className="grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Statut">
                <ConsumerStatusBadge isActive={consumer.isActive} />
              </Field>
              <Field label="Inscrit le">{dateFormat.format(new Date(consumer.createdOn))}</Field>
              <Field label="Connexion">
                {consumer.isByGoogle ? "Google" : "E-mail et mot de passe"}
              </Field>
              <Field label="E-mail vérifié">{yesNo(consumer.isEmailVerified)}</Field>
              <Field label="Double authentification">{yesNo(consumer.isMFAActivated)}</Field>
              <Field label="Identifiant">
                <code className="font-mono text-sm">{consumer.id}</code>
              </Field>
            </Grid>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
