"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Client-side handler for password reset email links.
 *
 * WHY CLIENT-SIDE (not a server route.ts)?
 * Supabase uses PKCE flow: when resetPasswordForEmail() is called in the browser,
 * a code verifier is stored in **localStorage** (not cookies). The email link
 * contains a one-time `code`. To exchange that code for a session, we MUST use
 * the browser Supabase client so it can read the verifier from localStorage.
 * A server route.ts reads cookies — it can't access localStorage — so
 * exchangeCodeForSession() would fail and redirect to /forgot-password.
 */
function ResetConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleReset = async () => {
      const code = searchParams.get("code");
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      try {
        // Fresh client reads PKCE verifier from cookies (same as the client that wrote it)
        const supabase = createSupabaseClient();
        if (code) {
          // PKCE flow — browser client reads verifier from localStorage
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          router.replace("/reset-password");
          return;
        }

        if (token_hash && type === "recovery") {
          // Legacy / non-PKCE flow
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: "recovery",
          });
          if (error) throw error;
          router.replace("/reset-password");
          return;
        }

        // No recognised token — go back to forgot-password
        throw new Error("No valid reset token found in link.");
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Invalid or expired reset link.";
        console.error("reset-confirm error:", msg);
        setErrorMsg(msg);
        setStatus("error");
        toast.error("Reset link expired or invalid. Please request a new one.");
        setTimeout(() => router.push("/forgot-password"), 2500);
      }
    };

    handleReset();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="space-y-4 max-w-sm">
        {status === "loading" ? (
          <>
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
            <h1 className="text-xl font-bold tracking-tight">
              Verifying reset link…
            </h1>
            <p className="text-sm text-muted-foreground">
              Please wait while we confirm your identity.
            </p>
          </>
        ) : (
          <div className="p-5 border border-destructive/20 bg-destructive/5 rounded-2xl">
            <h1 className="text-lg font-bold text-destructive mb-1">
              Link Invalid
            </h1>
            <p className="text-xs text-muted-foreground mb-2">{errorMsg}</p>
            <p className="text-xs font-semibold text-brand-600">
              Redirecting to reset page…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      }
    >
      <ResetConfirmContent />
    </Suspense>
  );
}
