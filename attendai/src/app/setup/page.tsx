"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield, Loader2, ArrowRight, ArrowLeft, Plus, Trash2,
  CheckCircle2, Building2, Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store";
import { authApi } from "@/lib/api";

interface DepartmentPreset {
  name: string;
  code: string;
}

export default function SetupWizardPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [orgName, setOrgName] = useState("");

  // Guard: redirect to login if no active Supabase session
  // Also guard against teachers/students who land here by mistake
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/login");
      } else {
        const metadata = data.session.user?.user_metadata;
        if (metadata?.role === "teacher" || metadata?.role === "student") {
          router.replace("/auth/callback");
          return;
        }
        if (metadata?.organization_name) {
          setOrgName(metadata.organization_name);
        }
      }
    });
  }, [router]);

  // If the user is already authenticated with a known role, redirect them away from setup
  const { user } = useAuthStore();
  useEffect(() => {
    if (user?.role === "teacher") {
      router.replace("/teacher");
    } else if (user?.role === "student") {
      router.replace("/student");
    }
  }, [user, router]);


  const [departments, setDepartments] = useState<DepartmentPreset[]>([
    { name: "Computer Science & Engineering", code: "CSE" },
    { name: "Electronics & Communication", code: "ECE" },
    { name: "Business Administration", code: "MBA" },
  ]);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");

  const addDepartment = () => {
    if (!newDeptName || !newDeptCode) {
      toast.error("Please enter department name and code");
      return;
    }
    if (departments.some((d) => d.code.toUpperCase() === newDeptCode.toUpperCase())) {
      toast.error("A department with this code already exists");
      return;
    }
    setDepartments([...departments, { name: newDeptName, code: newDeptCode.toUpperCase() }]);
    setNewDeptName("");
    setNewDeptCode("");
    toast.success("Department added");
  };

  const removeDepartment = (code: string) => {
    setDepartments(departments.filter((d) => d.code !== code));
  };

  const handleCompleteSetup = async () => {
    if (!orgName.trim()) {
      toast.error("Please enter your organization name");
      setStep(1);
      return;
    }

    setIsLoading(true);
    try {
      const result = await authApi.completeSetup({
        organization_name: orgName,
        departments: departments,
      });

      const profile = result.data.profile;
      const organization = result.data.organization;

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
          logo_url: "",
          plan: "starter" as const,
        },
      });

      toast.success("Organization setup complete!");
      router.push("/admin");
    } catch (error: unknown) {
      console.error("Setup failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to complete setup. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col justify-between font-sans">

      <header className="h-16 border-b bg-card flex items-center px-6 sm:px-12 justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold gradient-text">IntelliPresence Onboarding</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <span>Step {step} of 2</span>
          <div className="w-24 bg-muted h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-2xl w-full mx-auto p-6 py-12 flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="border bg-card p-6 sm:p-8 rounded-2xl shadow-xl space-y-6"
            >
              <div>
                <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-brand-500" />
                  Your Organization
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Set up your organization and departments. You can invite teachers from the admin dashboard after setup.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Organization Name</Label>
                <Input
                  placeholder="e.g. University of Excellence"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label className="text-xs font-semibold">Departments</Label>
                <div className="flex flex-col gap-2">
                  {departments.map((dept) => (
                    <div
                      key={dept.code}
                      className="flex items-center justify-between p-3 border rounded-xl bg-muted/20"
                    >
                      <div>
                        <p className="text-sm font-semibold">{dept.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">Code: {dept.code}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDepartment(dept.code)}
                        className="h-8 w-8 text-danger hover:text-danger hover:bg-danger/10"
                        disabled={departments.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-xs font-semibold mb-2 block">Add Department</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <div className="col-span-2 space-y-1">
                    <Input
                      placeholder="e.g. Mechanical Engineering"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      className="h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Input
                      placeholder="Code (e.g. MECH)"
                      value={newDeptCode}
                      onChange={(e) => setNewDeptCode(e.target.value)}
                      className="h-10 text-xs font-mono"
                    />
                  </div>
                  <Button
                    onClick={addDepartment}
                    className="h-10 text-xs font-semibold flex items-center justify-center gap-1 col-span-3 sm:col-span-1"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-xs text-muted-foreground">Teachers are invited later from Admin → Teachers.</span>
                <Button onClick={() => setStep(2)} className="btn-brand gap-2 text-xs font-semibold">
                  Review & Finish
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="border bg-card p-6 sm:p-8 rounded-2xl shadow-xl space-y-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-brand-500/10 text-brand-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">Ready to launch</h1>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto">
                  Your workspace will be created with the organization and departments below.
                  Invite teachers from the admin dashboard once you&apos;re in.
                </p>
              </div>

              <div className="border rounded-xl p-4 bg-muted/20 text-left text-xs space-y-3">
                <div>
                  <p className="text-muted-foreground">Organization</p>
                  <p className="font-bold text-sm">{orgName || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Departments</p>
                  <p className="font-bold text-lg">{departments.length}</p>
                  <ul className="mt-1 space-y-0.5 text-muted-foreground">
                    {departments.map((d) => (
                      <li key={d.code}>{d.name} ({d.code})</li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-start gap-2 pt-2 border-t text-muted-foreground">
                  <Users className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>After setup, go to <span className="font-semibold text-foreground">Admin → Teachers → Invite</span> to add staff.</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="ghost" onClick={() => setStep(1)} className="gap-2 text-xs font-semibold" disabled={isLoading}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  onClick={handleCompleteSetup}
                  disabled={isLoading}
                  className="btn-brand gap-2 text-xs font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating workspace...
                    </>
                  ) : (
                    <>
                      Finish & Go to Dashboard
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <footer className="h-12 border-t bg-card/60 flex items-center justify-center text-[10px] text-muted-foreground">
        © 2026 IntelliPresence Platform Inc.
      </footer>
    </div>
  );
}
