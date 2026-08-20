"use client";

import { useState, useEffect } from "react";
import { useUIStore, useNotificationStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Search, Menu, Settings, LogOut, User, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface TopBarProps {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function TopBar({ title, breadcrumbs }: TopBarProps) {
  const { sidebarCollapsed, setCommandPaletteOpen, setMobileMenuOpen } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getProfileHref = () => {
    if (user?.role === "teacher") return "/teacher/profile";
    if (user?.role === "student") return "/student/profile";
    return "/admin/profile";
  };

  const getSettingsHref = () => {
    if (user?.role === "teacher") return "/teacher/settings";
    if (user?.role === "student") return "/student/profile";
    return "/admin/settings";
  };

  const getNotificationsHref = () => {
    if (user?.role === "teacher") return "/teacher/notifications";
    if (user?.role === "student") return "/student/notifications";
    return "/admin/notifications";
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur-sm",
        "flex items-center gap-4 px-6 transition-all duration-250",
        sidebarCollapsed ? "left-[72px]" : "left-[256px]"
      )}
    >
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileMenuOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Breadcrumb / Title */}
      <div className="flex-1 min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="flex items-center gap-1">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className={cn(
                      "text-sm hover:text-foreground transition-colors",
                      i === breadcrumbs.length - 1
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "text-sm",
                      i === breadcrumbs.length - 1
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        ) : (
          <h1 className="text-sm font-semibold truncate">{title}</h1>
        )}
      </div>

      {/* Search */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-sm text-muted-foreground hover:bg-muted transition-colors min-w-[200px]"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-background border border-border">
          ⌘K
        </kbd>
      </button>

      {/* Notifications — role-aware routing */}
      <Link href={getNotificationsHref()}>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4.5 h-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger rounded-full text-[9px] text-white font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </Link>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="relative h-8 w-8 rounded-full p-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-full">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarImage src={mounted ? user?.avatar_url : undefined} />
                <AvatarFallback className="text-xs gradient-brand text-white">
                  {mounted && user?.full_name ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "A"}
                </AvatarFallback>
              </Avatar>
            </button>
          }
        />
        <DropdownMenuContent align="end" className="w-64 p-0 overflow-hidden">
          {/* Header card */}
          <div className="flex flex-col items-center gap-3 px-4 py-5 bg-gradient-to-b from-[hsl(var(--primary)/0.15)] to-[hsl(var(--primary)/0.05)] border-b border-border">
            <Avatar className="h-14 w-14 ring-2 ring-primary/30">
              <AvatarImage src={mounted ? user?.avatar_url : undefined} />
              <AvatarFallback className="text-lg gradient-brand text-white">
                {mounted && user?.full_name ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "A"}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="text-sm font-semibold leading-tight">{mounted && user?.full_name ? user.full_name : "Admin User"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{mounted && user?.email ? user.email : "admin@IntelliPresence.com"}</p>
              <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium capitalize">
                {mounted && user?.role ? user.role : "admin"}
              </span>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push(getProfileHref())}
            >
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push(getSettingsHref())}
            >
              <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
