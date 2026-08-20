"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      // Fresh client instance ensures PKCE verifier is written to cookies (not localStorage)
      const supabase = createSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      setSubmitted(true);
      toast.success("Recovery instructions sent!");
    } catch {
      toast.error("Something went wrong, please try again");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative font-sans overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Logo Header */}
      <Link href="/" className="flex items-center gap-2 mb-8 relative z-10">
        <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-brand-sm">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold gradient-text">IntelliPresence</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md border bg-card p-8 rounded-2xl shadow-xl relative z-10"
      >
        {!submitted ? (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold tracking-tight">Forgot password?</h1>
              <p className="text-xs text-muted-foreground mt-1.5">
                No problem. Enter your email and we&apos;ll send you reset instructions.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-11 rounded-lg"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-brand h-11 rounded-lg gap-2 text-sm font-semibold mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending email...
                  </>
                ) : (
                  "Send Recovery Email"
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Check your email</h1>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
              We&apos;ve sent a link to <span className="font-semibold text-foreground">{email}</span>. Click the link in the email to reset your password.
            </p>
            <Button
              variant="outline"
              onClick={() => setSubmitted(false)}
              className="mt-2 text-xs"
            >
              Didn&apos;t receive it? Try again
            </Button>
          </div>
        )}

        <div className="border-t border-border mt-6 pt-4 text-center">
          <Link
            href="/login"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
