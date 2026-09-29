import type { AppClient } from "@/api/apps.api";
import { Link } from "@/components/Link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@quickadui/data";
import { AppStatusBadge } from "./AppStatusBadge";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

/** Liste des applications. Le secret n'y figure jamais : il n'est visible que sur la page de détail. */
export function AppsTable({ apps }: { apps: AppClient[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="hidden md:table-cell">Redirection</TableHead>
          <TableHead className="hidden sm:table-cell">Créée le</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {apps.map((app) => (
          <TableRow key={app.id}>
            <TableCell>
              <Link
                to={`/apps/${encodeURIComponent(app.id)}`}
                className="font-medium text-accent-11 underline-offset-4 hover:underline"
              >
                {app.name}
              </Link>
            </TableCell>
            <TableCell>
              <AppStatusBadge isActive={app.isActive} />
            </TableCell>
            <TableCell className="hidden text-neutral-11 md:table-cell">
              {app.redirectUrl}
            </TableCell>
            <TableCell className="hidden text-neutral-11 sm:table-cell">
              {dateFormat.format(new Date(app.createdAt))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
