"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, SectionCard } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import {
  Building2, Lock, Sliders, Database, CreditCard, Save,
  CheckCircle2, Bell, Cpu, HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [orgName, setOrgName] = useState("Apex Institute of Technology");
  const [orgDomain, setOrgDomain] = useState("apex-tech");
  const [n8nUrl, setN8nUrl] = useState("https://n8n.workflow.myorg.com/webhook/attendance");
  const [s3Bucket, setS3Bucket] = useState("IntelliPresence-reports-storage");

  // Feature Toggles
  const [enableFace, setEnableFace] = useState(false);
  const [enableQR, setEnableQR] = useState(true);
  const [notifyAbsents, setNotifyAbsents] = useState(true);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1400));
    setIsSaving(false);
    toast.success("Settings updated successfully!");
  };

  return (
    <DashboardLayout
      breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Settings" }]}
    >
      <PageHeader
        title="Settings"
        description="Configure your workspace details, security parameters, and subscription billing"
      />

      <Tabs defaultValue="general" className="w-full">
        
        {/* Tabs triggers */}
        <div className="mb-6">
          <TabsList className="bg-muted p-1 rounded-xl border">
            <TabsTrigger value="general" className="gap-2 text-xs">
              <Building2 className="w-4 h-4" /> General
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 text-xs">
              <Lock className="w-4 h-4" /> Security
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2 text-xs">
              <CreditCard className="w-4 h-4" /> Billing
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab contents: General */}
        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <SectionCard title="Workspace Settings">
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="orgDomain">Workspace Subdomain URL</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                        IntelliPresence.com/
                      </span>
                      <Input
                        id="orgDomain"
                        value={orgDomain}
                        onChange={(e) => setOrgDomain(e.target.value)}
                        className="pl-[94px] font-mono text-sm"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={isSaving} className="btn-brand gap-2 text-xs font-semibold">
                    {isSaving ? "Saving changes..." : "Save Configuration"}
                    <Save className="w-4 h-4" />
                  </Button>
                </form>
              </SectionCard>

              {/* Module Toggles */}
              <SectionCard title="Feature Toggles">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold flex items-center gap-1.5">
                        Enable QR Code Attendance
                        <Badge variant="outline" className="text-[9px]">Beta</Badge>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Students scan active classroom dynamic QR codes to register session marks.
                      </p>
                    </div>
                    <Switch checked={enableQR} onCheckedChange={setEnableQR} />
                  </div>

                  <div className="flex items-center justify-between border-t pt-4">
                    <div>
                      <p className="text-xs font-semibold flex items-center gap-1.5">
                        Enable Facial Recognition
                        <Badge variant="outline" className="text-[9px]">AI Powered</Badge>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Uses AWS Rekognition to trace attendance via lecture hall camera snaps.
                      </p>
                    </div>
                    <Switch checked={enableFace} onCheckedChange={setEnableFace} />
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="lg:col-span-1">
              <SectionCard title="Workspace ID">
                <div className="space-y-2 text-xs">
                  <p className="text-muted-foreground">This is your unique workspace reference identifier for API actions.</p>
                  <pre className="p-3 bg-muted/60 border rounded-lg font-mono text-[10px] select-all cursor-pointer">
                    org_9f28a38b1d9c4f03
                  </pre>
                </div>
              </SectionCard>
            </div>
          </div>
        </TabsContent>


        {/* Tab contents: Security */}
        <TabsContent value="security">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SectionCard title="Security Parameters">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">Enforce Multi-Factor Authentication</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Force teachers and administrators to sign in using Google Authenticator codes.
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between border-t pt-4">
                    <div>
                      <p className="text-xs font-semibold">Row-Level Security Schema Restriction</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Force rigid isolated PostgreSQL schemas.
                      </p>
                    </div>
                    <Switch checked readOnly disabled />
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </TabsContent>

        {/* Tab contents: Billing */}
        <TabsContent value="billing">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SectionCard title="Subscription Details">
                <div className="flex justify-between items-center bg-brand-50/40 dark:bg-brand-950/15 border border-brand-200/50 p-4 rounded-xl mb-4">
                  <div>
                    <h3 className="text-sm font-semibold">IntelliPresence Pro Plan</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enables up to 2,000 active students and unlimited teachers.
                    </p>
                  </div>
                  <Badge className="bg-brand-600 text-white">Active Plan</Badge>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Renewal Date</span>
                    <span className="font-semibold">August 05, 2026</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-3">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="font-semibold">Visa ending in 8294</span>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </DashboardLayout>
  );
}
