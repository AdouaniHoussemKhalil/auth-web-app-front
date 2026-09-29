import { navigate } from "@/lib/router";
import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@quickadui/core";
import { Button } from "@/components/Button";
import { useAuth } from "../hooks/useAuth";

/** Menu du tenant connecté dans la barre du haut : identité et déconnexion. */
export function UserMenu() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto gap-2 rounded-full py-1 pr-3 pl-1"
          aria-label={`Menu de ${user.firstName} ${user.lastName}`}
        >
          <Avatar size="sm">
            <AvatarFallback className="bg-accent-3 text-xs font-semibold text-accent-11">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{user.firstName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div>
            {user.firstName} {user.lastName}
          </div>
          <div className="text-xs font-normal text-neutral-11">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            void logout().then(() => navigate("/login", { replace: true }));
          }}
        >
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
