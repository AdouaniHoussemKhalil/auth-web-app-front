import { Badge } from "@quickadui/core";

export function AppStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "success" : "soft"}>{isActive ? "Active" : "Désactivée"}</Badge>
  );
}
