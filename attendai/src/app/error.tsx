"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, RefreshCw, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console or telemetry service
    console.error("Unhandled runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.03),transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-md text-center z-10 space-y-6">
        {/* Animated Warning Shield */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
          className="mx-auto w-20 h-20 rounded-2xl bg-danger/10 border border-danger/20 shadow-lg flex items-center justify-center mb-6"
        >
          <ShieldAlert className="w-10 h-10 text-danger animate-pulse" />
        </motion.div>

        {/* Text descriptions */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-danger/10 text-danger border border-danger/20 mb-3 select-none">
            <span>SYSTEM FAILURE (500)</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            An unexpected error occurred in our systems. Please refresh the page or contact support if the issue persists.
          </p>
        </div>

        {/* Retry controls */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pt-4 flex flex-col gap-3"
        >
          <Button onClick={() => reset()} className="w-full gap-2 shadow-danger-sm">
            <RefreshCw className="w-4 h-4" /> Try reloading page
          </Button>
          <a href="mailto:support@IntelliPresence.app" className="w-full">
            <Button variant="ghost" className="w-full gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              Contact IntelliPresence Support <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </a>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-[11px] text-muted-foreground/80 z-10">
        <span>© 2026 IntelliPresence Corp.</span>
        <span>Ref: {error.digest ?? "SYS_ERR_GATEWAY"}</span>
      </div>
    </div>
  );
}
