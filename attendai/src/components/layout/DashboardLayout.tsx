"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useAuthStore, useUIStore } from "@/store";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: "org_admin" | "teacher" | "student";
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function DashboardLayout({
  children,
  role = "org_admin",
  title,
  breadcrumbs,
}: DashboardLayoutProps) {
  const { sidebarCollapsed } = useUIStore();
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // wait for hydration

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== role) {
      if (user.role === "teacher") router.replace("/teacher");
      else if (user.role === "student") router.replace("/student");
      else router.replace("/admin");
    }
  }, [isLoading, user, role, router]);

  // While loading, show spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Not logged in or wrong role — let the useEffect redirect handle it
  if (!user || user.role !== role) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar role={role} />
      <TopBar title={title} breadcrumbs={breadcrumbs} />
      <motion.main
        animate={{ marginLeft: sidebarCollapsed ? 72 : 256 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="pt-16 min-h-screen"
      >
        <div className="p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}
