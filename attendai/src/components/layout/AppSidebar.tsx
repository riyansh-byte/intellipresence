"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUIStore, useAuthStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, CalendarCheck,
  BarChart3, FileText, Bell, Workflow, ClipboardList, Settings,
  ChevronLeft, ChevronRight, LogOut, Sun, Moon, Menu,
  Shield, UserCheck,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { useNotificationStore } from "@/store";

// ─────────────────────────────────────────
// Nav Config (role-aware)
// ─────────────────────────────────────────

const adminNav = [
  {
    label: "Overview",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/students", icon: GraduationCap, label: "Students" },
      { href: "/admin/teachers", icon: UserCheck, label: "Teachers" },
      { href: "/admin/departments", icon: BookOpen, label: "Departments" },
    ],
  },
  {
    label: "Attendance",
    items: [
      { href: "/admin/attendance", icon: CalendarCheck, label: "Attendance" },
      { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
      { href: "/admin/reports", icon: FileText, label: "Reports" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/notifications", icon: Bell, label: "Notifications" },
      { href: "/admin/audit-logs", icon: ClipboardList, label: "Audit Logs" },
      { href: "/admin/settings", icon: Settings, label: "Settings" },
    ],
  },
];

const teacherNav = [
  {
    label: "Overview",
    items: [
      { href: "/teacher", icon: LayoutDashboard, label: "Dashboard", exact: true },
    ],
  },
  {
    label: "Teaching",
    items: [
      { href: "/teacher/attendance", icon: CalendarCheck, label: "Attendance" },
      { href: "/teacher/students", icon: Users, label: "Students" },
      { href: "/teacher/classes", icon: BookOpen, label: "Classes" },
      { href: "/teacher/reports", icon: FileText, label: "Reports" },
      { href: "/teacher/leave-requests", icon: ClipboardList, label: "Leave Requests" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/teacher/settings", icon: Settings, label: "Settings" },
    ],
  },
];

const studentNav = [
  {
    label: "Overview",
    items: [
      { href: "/student", icon: LayoutDashboard, label: "Dashboard", exact: true },
    ],
  },
  {
    label: "My Academics",
    items: [
      { href: "/student/attendance", icon: CalendarCheck, label: "Attendance" },
      { href: "/student/leave", icon: ClipboardList, label: "Leave Requests" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/student/settings", icon: Settings, label: "Settings" },
    ],
  },
];

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

interface AppSidebarProps {
  role?: "org_admin" | "teacher" | "student";
}

export function AppSidebar({ role = "org_admin" }: AppSidebarProps) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  // Prevent hydration mismatch: useTheme() returns undefined on the server.
  // Only render theme-dependent JSX after the component has mounted on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const nav = role === "teacher" ? teacherNav : role === "student" ? studentNav : adminNav;
  const navItems = nav as Array<{ label: string; items: Array<{ href: string; icon: typeof LayoutDashboard; label: string; exact?: boolean }> }>;

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <TooltipProvider delay={0}>
      <motion.aside
        animate={{ width: sidebarCollapsed ? 72 : 256 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-screen z-40 flex flex-col border-r border-border bg-[hsl(var(--sidebar-background))] overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-border shrink-0">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shrink-0 shadow-brand-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <span className="text-sm font-bold tracking-tight gradient-text whitespace-nowrap">
                    IntelliPresence
                  </span>
                  <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                    Attendance Intelligence
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
          {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-7 w-7 shrink-0"
              onClick={toggleSidebar}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6 no-scrollbar">
          {navItems.map((group) => (
            <div key={group.label}>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="section-label px-2 mb-2"
                  >
                    {group.label}
                  </motion.p>
                )}
              </AnimatePresence>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href, item.exact);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Link
                              href={item.href}
                              className={cn(
                                "sidebar-item relative",
                                active && "active",
                                sidebarCollapsed && "justify-center px-2"
                              )}
                            >
                              <Icon className={cn("w-4 h-4 shrink-0", active && "text-primary")} />
                              <AnimatePresence>
                                {!sidebarCollapsed && (
                                  <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="truncate"
                                  >
                                    {item.label}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                              {/* Notification badge on Bell */}
                              {item.icon === Bell && unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
                              )}
                              {/* Active indicator */}
                              {active && (
                                <motion.div
                                  layoutId="sidebar-active"
                                  className="absolute inset-0 rounded-lg bg-accent"
                                  style={{ zIndex: -1 }}
                                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                                />
                              )}
                            </Link>
                          }
                        />
                        {sidebarCollapsed && (
                          <TooltipContent side="right">
                            {item.label}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="p-2 border-t border-border space-y-1 shrink-0">
          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className={cn(
                    "w-full justify-start gap-3 h-9",
                    sidebarCollapsed && "justify-center px-0"
                  )}
                >
                  {mounted ? (
                    theme === "dark" ? (
                      <Sun className="w-4 h-4 text-warning shrink-0" />
                    ) : (
                      <Moon className="w-4 h-4 text-brand-500 shrink-0" />
                    )
                  ) : (
                    // Neutral placeholder during SSR — matches server + client
                    <Sun className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <AnimatePresence>
                    {!sidebarCollapsed && mounted && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {theme === "dark" ? "Light Mode" : "Dark Mode"}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              }
            />
            {sidebarCollapsed && (
              <TooltipContent side="right">Toggle Theme</TooltipContent>
            )}
          </Tooltip>

          {/* Collapse button (when expanded) */}
          {sidebarCollapsed && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSidebar}
                    className="w-full justify-center h-9"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                }
              />
              <TooltipContent side="right">Expand Sidebar</TooltipContent>
            </Tooltip>
          )}

          {/* User */}
          <Tooltip>
            <TooltipTrigger
              render={
                <div className={cn(
                  "flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-accent transition-colors",
                  sidebarCollapsed && "justify-center px-0"
                )}>
                  <Avatar className="w-7 h-7 shrink-0 ring-2 ring-primary/20">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="text-xs gradient-brand text-white">
                      {user?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2) ?? "A"}
                    </AvatarFallback>
                  </Avatar>
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 min-w-0"
                      >
                        <p className="text-xs font-medium truncate">{user?.full_name ?? "Admin User"}</p>
                        <p className="text-[10px] text-muted-foreground truncate capitalize">
                          {(user?.role ?? "org_admin").replace("_", " ")}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!sidebarCollapsed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              }
            />
            {sidebarCollapsed && (
              <TooltipContent side="right">
                {user?.full_name ?? "Admin User"}
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
