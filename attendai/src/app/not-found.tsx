"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { HelpCircle, ChevronRight, Home, ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background radial gradient decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.05),transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-md text-center z-10 space-y-6">
        {/* Animated Icon Card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
          className="mx-auto w-20 h-20 rounded-2xl bg-muted border border-border shadow-card flex items-center justify-center mb-6"
        >
          <HelpCircle className="w-10 h-10 text-primary animate-pulse" />
        </motion.div>

        {/* Title */}
        <div className="space-y-2">
          <Badge404 />
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Lost in Space
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            The page you're searching for does not exist, has been removed, or moved to another directory.
          </p>
        </div>

        {/* Action button */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pt-4 flex flex-col gap-3"
        >
          <Link href="/">
            <Button className="w-full gap-2 shadow-brand-sm">
              <Home className="w-4 h-4" /> Go back home
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" className="w-full gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              Sign In to IntelliPresence <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
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

function Badge404() {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-danger/10 text-danger border border-danger/20 mb-3 select-none">
      <ShieldAlert className="w-3.5 h-3.5" />
      <span>STATUS CODE 404</span>
    </div>
  );
}
