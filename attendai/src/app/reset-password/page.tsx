"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, KeyRound, Eye, EyeOff, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase, createSupabaseClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { syncProfile } = useAuthStore();
  const customMessage = searchParams.get("message");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionChecking, setIsSessionChecking] = useState(true);
  // Password validation rules
  const rules = {
    minLength: password.length >= 6,
    hasNumber: /\d/.test(password),
    hasLetter: /[a-zA-Z]/.test(password),
    match: password === confirmPassword && password.length > 0,
  };

  useEffect(() => {
    let mounted = true;
    console.log("[ResetPassword] Component mounted. URL:", typeof window !== "undefined" ? window.location.href : "");

    // 1. Listen for Supabase auth state changes (e.g. PASSWORD_RECOVERY, SIGNED_IN)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[ResetPassword] onAuthStateChange event:", event, "session:", !!session);
      if (!mounted) return;
      if (session || event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setIsSessionChecking(false);
      }
    });

    const checkInitialSession = async () => {
      try {
        // Check for error in query or hash (e.g. error_description)
        const errorDesc = searchParams.get("error_description");
        const hashStr = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
        const hashParams = new URLSearchParams(hashStr);
        const hashErrorDesc = hashParams.get("error_description");

        if (errorDesc || hashErrorDesc) {
          const failureMsg = errorDesc || hashErrorDesc || "Reset link is invalid or has expired";
          console.error("[ResetPassword] URL contained error_description:", failureMsg);
          if (mounted) {
            toast.error(failureMsg);
            setTimeout(() => router.push("/forgot-password"), 3000);
          }
          return;
        }

        // 2. Handle explicit code parameter (?code=...)
        const code = searchParams.get("code");
        if (code) {
          console.log("[ResetPassword] Found code in searchParams, exchanging code...");
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("[ResetPassword] exchangeCodeForSession failed:", error.message);
          } else if (data?.session && mounted) {
            console.log("[ResetPassword] exchangeCodeForSession succeeded!");
            window.history.replaceState({}, "", "/reset-password");
            setIsSessionChecking(false);
            return;
          }
        }

        // 3. Handle explicit OTP token_hash parameter (?token_hash=...&type=recovery)
        const token_hash = searchParams.get("token_hash");
        const type = searchParams.get("type");
        if (token_hash && type === "recovery") {
          console.log("[ResetPassword] Found token_hash, verifying OTP...");
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: "recovery",
          });
          if (error) {
            console.error("[ResetPassword] verifyOtp failed:", error.message);
          } else if (data?.session && mounted) {
            console.log("[ResetPassword] verifyOtp succeeded!");
            window.history.replaceState({}, "", "/reset-password");
            setIsSessionChecking(false);
            return;
          }
        }

        // 4. Handle URL hash fragment (#access_token=...&refresh_token=...)
        if (hashStr) {
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            console.log("[ResetPassword] Found hash access_token, setting session...");
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              console.error("[ResetPassword] setSession failed:", error.message);
            } else if (data?.session && mounted) {
              console.log("[ResetPassword] setSession succeeded!");
              window.history.replaceState({}, "", "/reset-password");
              setIsSessionChecking(false);
              return;
            }
          }
        }

        // 5. Immediate session check
        const { data: { session: immediateSession } } = await supabase.auth.getSession();
        if (immediateSession && mounted) {
          console.log("[ResetPassword] Immediate session check found active session!");
          setIsSessionChecking(false);
          return;
        }

        // 6. Grace period (2.5s) to allow Supabase background initialization to finish
        console.log("[ResetPassword] Waiting 2.5s grace period for Supabase initialization...");
        await new Promise((resolve) => setTimeout(resolve, 2500));

        const { data: { session: finalSession } } = await supabase.auth.getSession();
        if (finalSession && mounted) {
          console.log("[ResetPassword] Session detected after grace period!");
          setIsSessionChecking(false);
          return;
        }

        // 7. Only redirect if after grace period no session exists and page is still mounted
        if (mounted) {
          console.warn("[ResetPassword] No session detected after all checks.");
          toast.error("Invalid or expired reset link. Please request a new one.");
          router.push("/forgot-password");
        }
      } catch (err: any) {
        console.error("[ResetPassword] Unexpected error in checkInitialSession:", err);
        if (mounted) {
          toast.error(err?.message || "Invalid or expired reset link. Please request a new one.");
          router.push("/forgot-password");
        }
      }
    };

    checkInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, searchParams]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rules.minLength || !rules.hasNumber || !rules.hasLetter) {
      toast.error("Please meet all password requirements.");
      return;
    }

    if (!rules.match) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      toast.success("Password updated successfully!");

      // Retrieve user profile to route them to the correct dashboard
      try {
        const user = await syncProfile();
        if (user.role === "org_admin") {
          router.push("/admin");
        } else if (user.role === "teacher") {
          router.push("/teacher");
        } else if (user.role === "student") {
          router.push("/student");
        } else {
          router.push("/");
        }
      } catch {
        // Fallback if profile sync fails
        router.push("/");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSessionChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-xs text-muted-foreground mt-2">Checking session validity...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative font-sans overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Logo Header */}
      <div className="flex items-center gap-2 mb-8 relative z-10">
        <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-brand-sm">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold gradient-text">IntelliPresence</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md border bg-card p-8 rounded-2xl shadow-xl relative z-10"
      >
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold tracking-tight">Set your password</h1>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            {customMessage || "Please enter a secure password for your account."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-9 h-11 rounded-lg font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-9 h-11 rounded-lg font-mono"
                required
              />
            </div>
          </div>

          {/* Validation Rules Checklist */}
          <div className="bg-muted/40 rounded-xl p-3 text-[11px] space-y-1.5">
            <div className="flex items-center gap-1.5">
              {rules.minLength ? (
                <Check className="w-3.5 h-3.5 text-success" />
              ) : (
                <X className="w-3.5 h-3.5 text-destructive" />
              )}
              <span className={rules.minLength ? "text-success font-medium" : "text-muted-foreground"}>
                At least 6 characters long
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {rules.hasLetter && rules.hasNumber ? (
                <Check className="w-3.5 h-3.5 text-success" />
              ) : (
                <X className="w-3.5 h-3.5 text-destructive" />
              )}
              <span className={rules.hasLetter && rules.hasNumber ? "text-success font-medium" : "text-muted-foreground"}>
                Contains both letters and numbers
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {rules.match ? (
                <Check className="w-3.5 h-3.5 text-success" />
              ) : (
                <X className="w-3.5 h-3.5 text-destructive" />
              )}
              <span className={rules.match ? "text-success font-medium" : "text-muted-foreground"}>
                Passwords match
              </span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !rules.minLength || !rules.hasLetter || !rules.hasNumber || !rules.match}
            className="w-full btn-brand h-11 rounded-lg gap-2 text-sm font-semibold mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating password...
              </>
            ) : (
              "Save Password & Continue"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-xs text-muted-foreground mt-2">Loading reset page...</p>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
