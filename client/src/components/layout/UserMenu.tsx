import { Link, useNavigate } from "react-router-dom";
import { LogOut, Settings, ShieldCheck, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/primitives";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser, useLogout } from "@/hooks/useAuth";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("");
}

export function UserMenu() {
  const user = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex items-center gap-1.5">
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link to="/login">Sign in</Link>
        </Button>
        <Button asChild size="sm">
          <Link to="/register">Get started</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-brand" aria-label="Account menu">
          <Avatar>
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Signed in</DropdownMenuLabel>
        <div className="flex items-center gap-2.5 px-2 pb-2">
          <Avatar>
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{user.name}</p>
            <p className="truncate text-xs text-subtle">{user.email}</p>
          </div>
        </div>
        <div className="px-2 pb-2">
          <Badge variant={user.role === "admin" ? "brand" : "neutral"}>{user.role === "admin" ? "Administrator" : "Member"}</Badge>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <UserIcon className="size-4" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Settings className="size-4" /> Settings
        </DropdownMenuItem>
        {user.role === "admin" ? (
          <DropdownMenuItem onClick={() => navigate("/admin")}>
            <ShieldCheck className="size-4" /> Admin console
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-down focus:text-down"
          onClick={() => logout.mutate(undefined, { onSettled: () => navigate("/login") })}
        >
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
