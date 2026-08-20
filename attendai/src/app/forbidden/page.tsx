"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store";
import { useRouter } from "next/navigation";
import { ShieldX, LogOut, ArrowLeft, Home } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ForbiddenPage() {
  const { logout, user } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    toast.success("Successfully logged out");
    router.push("/login");
  };

  const handleGoBack = () => {
    // Redirect to correct dashboard based on role
    if (user?.role === "super_admin" || user?.role === "org_admin") {
      router.push("/admin");
    } else if (user?.role === "teacher") {
      router.push("/teacher");
    } else if (user?.role === "student") {
      router.push("/student");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.02),transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-md text-center z-10 space-y-6">
        {/* Animated warning card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
          className="mx-auto w-20 h-20 rounded-2xl bg-danger/10 border border-danger/20 shadow-md flex items-center justify-center mb-6"
        >
          <ShieldX className="w-10 h-10 text-danger" />
        </motion.div>

        {/* Text descriptions */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-danger/10 text-danger border border-danger/20 mb-3 select-none">
            <span>ACCESS RESTRICTED (403)</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Forbidden Area
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            You do not have administrative clearance to access this directory. If you believe this is an error, check your role credentials.
          </p>
        </div>

        {/* User identification */}
        {user && (
          <div className="border border-border/80 bg-muted/40 p-3.5 rounded-xl text-xs max-w-xs mx-auto space-y-1">
            <p className="text-muted-foreground">Logged in as: <strong className="font-semibold text-foreground">{user.full_name}</strong></p>
            <p className="text-muted-foreground font-mono">Assigned Role: <span className="text-primary font-bold uppercase">{user.role}</span></p>
          </div>
        )}

        {/* Navigation CTAs */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pt-4 flex flex-col gap-3"
        >
          <Button onClick={handleGoBack} className="w-full gap-2 shadow-brand-sm">
            <Home className="w-4 h-4" /> Return to Dashboard
          </Button>
          
          <Button onClick={handleLogout} variant="outline" className="w-full gap-2 text-danger hover:text-danger hover:bg-danger/5">
            <LogOut className="w-4 h-4" /> Sign In as Different User
          </Button>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-[11px] text-muted-foreground/80 z-10">
        <span>© 2026 IntelliPresence Corp.</span>
        <a href="mailto:support@IntelliPresence.app" className="hover:text-foreground underline underline-offset-4 transition-colors">
          Contact support
        </a>
      </div>
    </div>
  );
}
