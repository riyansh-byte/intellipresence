"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, ArrowRight, ArrowLeft, Building2, User, Key, CheckCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { authApi } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form Fields
  const [orgName, setOrgName] = useState("");
  const [domain, setDomain] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!orgName || !domain) {
        toast.error("Please fill in all organization details");
        return;
      }
      setStep(2);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName || !email || !password) {
      toast.error("Please complete all fields");
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: adminName,
          organization_name: orgName,
          organization_slug: domain,
          organization_id: "",
        },
      },
    });

    if (error || !data.user) {
      setIsLoading(false);
      toast.error(error?.message || "Unable to create account");
      return;
    }

    // If session is immediately available (email confirmation disabled), complete setup atomically
    if (data.session) {
      try {
        const setupResult = await authApi.completeSetup({
          organization_name: orgName,
          departments: [
            { name: "Computer Science & Engineering", code: "CSE" },
            { name: "Electronics & Communication", code: "ECE" }
          ]
        });

        const profile = setupResult.data.profile;
        const organization = setupResult.data.organization;

        setUser({
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          organization_id: profile.organization_id,
          organization: {
            id: organization.id,
            name: organization.name,
            slug: organization.domain,
            logo_url: organization.logo_url || "",
            plan: "starter"
          }
        });

        toast.success("Organization registered and setup completed successfully!");
        router.push("/admin");
      } catch (setupErr: any) {
        console.error("Atomic setup failed:", setupErr);
        toast.error("Account created, but database setup failed. Please complete it on the next screen.");
        router.push("/setup");
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
      toast.success("Registration successful! Please confirm your email address to complete setup.");
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background font-sans overflow-hidden">
      
      {/* Form Container (Left 5 cols) */}
      <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-12 md:p-16 relative">
        <div className="absolute top-0 left-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header */}
        <Link href="/" className="flex items-center gap-2 relative z-10 shrink-0">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-brand-sm">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold gradient-text">IntelliPresence</span>
        </Link>

        {/* Step-by-Step wizard */}
        <div className="my-auto py-8 max-w-md w-full mx-auto relative z-10">
          {/* Progress Indicators */}
          <div className="flex items-center gap-2 mb-6">
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
              step >= 1 ? "bg-brand-500/10 text-brand-600" : "bg-muted text-muted-foreground"
            }`}>
              1. Organization
            </span>
            <span className="w-4 h-px bg-border" />
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
              step === 2 ? "bg-brand-500/10 text-brand-600" : "bg-muted text-muted-foreground"
            }`}>
              2. Account Setup
            </span>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h1 className="text-2xl font-bold tracking-tight mb-1">Create your workspace</h1>
                  <p className="text-sm text-muted-foreground">
                    Get started by entering details for your organization.
                  </p>
                </div>

                <form onSubmit={handleNextStep} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="orgName">Organization / School Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                      <Input
                        id="orgName"
                        type="text"
                        placeholder="e.g. Apex High School"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="pl-9 h-11 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="domain">Domain / Slug identifier</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70 font-mono">
                        IntelliPresence.com/
                      </span>
                      <Input
                        id="domain"
                        type="text"
                        placeholder="apexschool"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="pl-[94px] h-11 rounded-lg font-mono text-sm"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      This is the URL students and teachers will use to access your portal.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full btn-brand h-11 rounded-lg gap-2 text-sm font-semibold mt-2"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight mb-1">Create Admin Account</h1>
                  <p className="text-sm text-muted-foreground">
                    Set up your owner credentials for <span className="font-semibold text-foreground">{orgName}</span>.
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="adminName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                      <Input
                        id="adminName"
                        type="text"
                        placeholder="e.g. Alex Mercer"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className="pl-9 h-11 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Work Email</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="alex@apexschool.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Min. 8 characters"
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
                        Creating workspace...
                      </>
                    ) : (
                      <>
                        Complete Registration
                        <CheckCircle className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-600 hover:underline font-medium">
              Log in instead
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground/60 text-center relative z-10 shrink-0">
          Supabase multi-tenant Row Level Security (RLS) active.
        </p>
      </div>

      {/* Right Information panel (7 cols) */}
      <div className="hidden lg:col-span-7 lg:flex flex-col justify-between p-12 md:p-16 relative bg-muted/40 border-l border-border/50">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        <div className="flex items-center gap-2 self-end text-xs text-muted-foreground/80 font-medium bg-background/50 border border-border/50 rounded-full px-3 py-1 backdrop-blur-sm relative z-10">
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          <span>Ready to deploy cloud infrastructure</span>
        </div>

        <div className="my-auto max-w-lg mx-auto relative z-10 w-full text-center sm:text-left">
          <h2 className="text-3xl font-extrabold tracking-tight mb-4">
            A secure foundation for organization analytics
          </h2>
          <div className="space-y-4">
            {[
              { title: "Isolated Tenant Database", desc: "Every organization has dedicated database security schemas ensuring compliance and privacy." },
              { title: "n8n Automation Connector", desc: "Seamlessly integrate your attendance logs with third-party messaging services, emails, or ERPs." },
              { title: "Scalable Cloud Hosting", desc: "Built with Supabase PostgreSQL and AWS S3 architecture for continuous runtime and performance." },
            ].map((feature) => (
              <div key={feature.title} className="p-4 rounded-xl border bg-card/65 backdrop-blur-md hover:shadow-card transition-all">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success shrink-0" />
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 ml-6 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground/60 relative z-10 shrink-0">
          <span>IntelliPresence Platform v1.2</span>
          <span>Security Compliant GDPR</span>
        </div>
      </div>
    </div>
  );
}
