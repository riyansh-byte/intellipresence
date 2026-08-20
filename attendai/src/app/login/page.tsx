"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, ArrowRight, Sparkles, Brain, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

function LoginContent() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [roleSelection, setRoleSelection] = useState<"org_admin" | "teacher" | "student">("org_admin");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const hasRecoveryQuery =
      searchParams.get("type") === "recovery" ||
      Boolean(searchParams.get("token_hash")) ||
      Boolean(searchParams.get("code"));
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const hasRecoveryHash =
      hashParams.get("type") === "recovery" ||
      Boolean(hashParams.get("access_token"));

    if (hasRecoveryQuery || hasRecoveryHash) {
      router.replace(`/reset-password${window.location.search}${window.location.hash}`);
      return;
    }

    if (searchParams.get("registered") === "1") {
      toast.success("Account created! Please sign in to complete your setup.");
    }
  }, [router, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!email || !password) {
      setFormError("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    // Step 1: Supabase sign-in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setIsLoading(false);
      setFormError(signInError.message || "Invalid email or password");
      return;
    }

    const token = signInData.session?.access_token;
    if (!token) {
      setIsLoading(false);
      setFormError("Sign-in succeeded but no session token was returned.");
      return;
    }

    // Step 2: Fetch role from backend with fresh token
    try {
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
      if (apiUrl && !apiUrl.endsWith("/api")) {
        apiUrl = `${apiUrl}/api`;
      }
      const res = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.message || `Server error (${res.status})`;

        if (res.status === 404 || msg.toLowerCase().includes("not found")) {
          // Try accepting pending invitation (teacher/student first login)
          try {
            const acceptRes = await fetch(`${apiUrl}/invitations/accept`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({}),
            });
            if (acceptRes.ok) {
              toast.success("Account activated!");
              window.location.href = "/reset-password?message=Please+set+your+password.";
              return;
            }
          } catch {}
          // Org admin first-time setup
          window.location.href = "/setup";
          return;
        }

        setIsLoading(false);
        setFormError(msg);
        return;
      }

      const data = await res.json();
      const profile = data?.data?.profile;
      const org = data?.data?.organization;
      const role = profile?.role;

      // Step 3: Store user in Zustand (writes to localStorage) BEFORE navigating
      setUser({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        organization_id: profile.organization_id,
        organization: {
          id: org?.id || "",
          name: org?.name || "",
          slug: org?.domain || "",
          logo_url: "",
          plan: "starter",
        },
      });

      const targetUrl = role === "org_admin" ? "/admin"
        : role === "teacher" ? "/teacher"
        : role === "student" ? "/student"
        : "/";

      window.location.replace(targetUrl);

    } catch (err: any) {
      setIsLoading(false);
      setFormError(`Cannot connect to server: ${err?.message || "http://localhost:5000 not reachable"}`);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background font-sans overflow-hidden">
      
      {/* Left panel - Sign-in Form */}
      <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-12 md:p-16 relative">
        {/* Soft background glow */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header */}
        <Link href="/" className="flex items-center gap-2 relative z-10 shrink-0">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-brand-sm">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold gradient-text">IntelliPresence</span>
        </Link>

        {/* Form Container */}
        <div className="my-auto py-8 max-w-md w-full mx-auto relative z-10">
          <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight mb-1.5">Welcome back</h1>
                <p className="text-sm text-muted-foreground">
                  Sign in to manage your organization's attendance intelligence
                </p>
              </div>

          {formError && (
            <div className="p-3 mb-4 border border-destructive/20 bg-destructive/10 text-destructive text-xs rounded-xl font-medium">
              {formError}
            </div>
          )}

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-muted rounded-xl border border-border/60 mb-6 text-xs font-medium">
            {(["org_admin", "teacher", "student"] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRoleSelection(role)}
                className={`py-2 rounded-lg capitalize transition-all duration-200 ${
                  roleSelection === role
                    ? "bg-card text-foreground shadow-card border border-border/20 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {role.replace("_", " ")}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Don't have an organization account?{" "}
            <Link href="/register" className="text-brand-600 hover:underline font-medium">
              Create an organization
            </Link>
          </p>
          </>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground/60 text-center relative z-10 shrink-0">
          Secure, Supabase-powered authentication.
        </p>
      </div>

      {/* Right panel - Design & Information Showcase */}
      <div className="hidden lg:col-span-7 lg:flex flex-col justify-between p-12 md:p-16 relative bg-muted/40 border-l border-border/50">
        {/* Animated gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        {/* Top Info */}
        <div className="flex items-center gap-2 self-end text-xs text-muted-foreground/80 font-medium bg-background/50 border border-border/50 rounded-full px-3 py-1 backdrop-blur-sm relative z-10">
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          <span>Automated workforce anomaly detection active</span>
        </div>

        {/* Card and graphic illustration in center */}
        <div className="my-auto max-w-lg mx-auto relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="rounded-2xl border bg-card p-6 shadow-2xl relative"
          >
            {/* Soft decorative elements inside the preview card */}
            <div className="flex items-center gap-2 mb-4 border-b border-border/60 pb-4">
              <Brain className="w-5 h-5 text-brand-500" />
              <div>
                <h3 className="text-sm font-semibold">Attendance Intelligence Overview</h3>
                <p className="text-[10px] text-muted-foreground">Live feed monitoring</p>
              </div>
              <span className="ml-auto w-2 h-2 bg-success rounded-full animate-pulse" />
            </div>

            <div className="space-y-3">
              {[
                { name: "Computer Science 301", present: 88, status: "Normal" },
                { name: "Electrical Eng 201", present: 74, status: "Warning" },
                { name: "Mechanical Eng 101", present: 93, status: "Optimal" },
              ].map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/40">
                  <div>
                    <p className="text-xs font-semibold">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">Class Attendance Rate</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold ${item.present < 75 ? "text-danger" : "text-success"}`}>
                      {item.present}%
                    </span>
                    <p className="text-[9px] text-muted-foreground">{item.status}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Glowing quote box floating behind */}
            <div className="absolute -bottom-6 -right-6 bg-brand-600 text-white rounded-xl p-4 shadow-xl max-w-xs text-xs font-medium border border-brand-500">
              <p className="italic">"We reduced administrative workload by 14 hours per week within the first month."</p>
              <p className="text-[10px] opacity-80 mt-1.5 font-normal">— Principal, K.V. Academy</p>
            </div>
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground/60 relative z-10 shrink-0">
          <span>IntelliPresence Platform v1.2</span>
          <span>Enterprise Grade SaaS</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-xs text-muted-foreground mt-2">Loading login...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
