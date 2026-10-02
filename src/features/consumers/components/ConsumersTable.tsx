import type { Consumer } from "@/api/consumers.api";
import { IconButton } from "@/components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@quickadui/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@quickadui/data";
import { MoreHorizontalIcon } from "@quickadui/icons";
import { dateFormat } from "../format";
import { ConsumerAccountBadges, ConsumerStatusBadge } from "./ConsumerBadges";

export type ConsumerAction = "details" | "block" | "unblock" | "delete";

export interface ConsumersTableProps {
  consumers: Consumer[];
  onAction: (consumer: Consumer, action: ConsumerAction) => void;
}

/** Utilisateurs d'une application, avec un menu d'actions par ligne. */
export function ConsumersTable({ consumers, onAction }: ConsumersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Utilisateur</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="hidden md:table-cell">Compte</TableHead>
          <TableHead className="hidden sm:table-cell">Inscrit le</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {consumers.map((consumer) => (
          <TableRow key={consumer.id}>
            <TableCell>
              <div className="font-medium">
                {consumer.firstName} {consumer.lastName}
              </div>
              <div className="text-sm text-neutral-11">{consumer.email}</div>
            </TableCell>
            <TableCell>
              <ConsumerStatusBadge isActive={consumer.isActive} />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <ConsumerAccountBadges consumer={consumer} />
            </TableCell>
            <TableCell className="hidden text-neutral-11 sm:table-cell">
              {dateFormat.format(new Date(consumer.createdOn))}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton size="sm" aria-label={`Actions pour ${consumer.email}`}>
                    <MoreHorizontalIcon />
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onAction(consumer, "details")}>
                    Voir le détail
                  </DropdownMenuItem>
                  {consumer.isActive ? (
                    <DropdownMenuItem onSelect={() => onAction(consumer, "block")}>
                      Bloquer
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onSelect={() => onAction(consumer, "unblock")}>
                      Débloquer
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-danger-11"
                    onSelect={() => onAction(consumer, "delete")}
                  >
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
