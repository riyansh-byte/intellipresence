"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { invitationsApi } from "@/lib/api";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : "";
  }
  return "";
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { syncProfile } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const next = searchParams.get("next");
        const isPasswordReset = next?.startsWith("/reset-password");

        if (code) {
          const params = new URLSearchParams(searchParams.toString());
          if (!params.has("next")) {
            params.set("next", "/auth/callback");
          }
          router.replace(`/auth/confirm?${params.toString()}`);
          return;
        }

        // Check if we have an established session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session) {
          router.push(isPasswordReset ? "/forgot-password" : "/login");
          return;
        }

        // Redirect to requested next page (like /reset-password) if present
        if (next) {
          router.push(next);
          return;
        }

        // Synchronize the profile with the backend database
        const user = await syncProfile();

        toast.success("Welcome to IntelliPresence!");

        // Route based on actual database profile role
        if (user.role === "org_admin") {
          router.push("/admin");
        } else if (user.role === "teacher") {
          router.push("/teacher");
        } else if (user.role === "student") {
          router.push("/student");
        } else {
          router.push("/");
        }
      } catch (err: unknown) {
        const errMsg = getErrorMessage(err);
        if (errMsg.includes("profile was not found")) {
          console.warn("Auth callback: user profile not found, proceeding to onboarding:", errMsg);
        } else {
          console.error("Auth callback error:", err);
        }
        if (errMsg.includes("profile was not found")) {
          try {
            toast.loading("Accepting your invitation...");
            await invitationsApi.accept();
            toast.dismiss();
            toast.success("Invitation accepted successfully!");
            
            // Retry profile sync after accept
            const user = await syncProfile();
            if (user.role === "teacher" || user.role === "student") {
              router.push("/reset-password?message=Welcome! Please set a password for your account.");
            } else {
              router.push("/");
            }
          } catch (acceptErr: unknown) {
            toast.dismiss();
            console.error("Failed to accept invitation:", acceptErr);
            // If they don't have an invitation either, they must be an Org Admin who needs onboarding
            toast.info("Welcome! Please complete your organization setup.");
            router.push("/setup");
          }
        } else {
          setError(errMsg || "Authentication callback failed");
          toast.error(errMsg || "Failed to establish session");
          // Redirect after 3 seconds on error
          setTimeout(() => {
            const next = searchParams.get("next");
            router.push(next?.startsWith("/reset-password") ? "/forgot-password" : "/login");
          }, 3000);
        }
      }
    };

    handleCallback();
  }, [router, searchParams, syncProfile]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="space-y-4 max-w-sm">
        {!error ? (
          <>
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
            <h1 className="text-xl font-bold tracking-tight">Completing authentication...</h1>
            <p className="text-sm text-muted-foreground">
              Setting up your session and loading your profile context. Please wait a moment.
            </p>
          </>
        ) : (
          <div className="p-5 border border-destructive/20 bg-destructive/5 rounded-2xl">
            <h1 className="text-lg font-bold text-destructive mb-1">Authentication Error</h1>
            <p className="text-xs text-muted-foreground mb-3">{error}</p>
            <p className="text-xs font-semibold text-brand-600">Redirecting to login page...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
        <h1 className="text-xl font-bold tracking-tight mt-4">Loading authentication...</h1>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
