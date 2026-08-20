"use client";

import { useAuthStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SectionCard } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import {
  User, Lock, Bell, Camera, Save, ShieldAlert,
  Loader2, RefreshCw, KeyRound, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

interface UserProfileEditorProps {
  roleLabel: string;
}

export function UserProfileEditor({ roleLabel }: UserProfileEditorProps) {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");

  // Form states
  const [fullName, setFullName] = useState(user?.full_name ?? "Admin User");
  const [email, setEmail] = useState(user?.email ?? "admin@IntelliPresence.com");
  const [phone, setPhone] = useState("+1 (555) 019-2834");
  const [bio, setBio] = useState("Member of the IntelliPresence administration board.");
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    if (user) {
      setUser({
        ...user,
        full_name: fullName,
        email: email,
        avatar_url: avatarUrl,
      });
    }
    
    setIsSaving(false);
    toast.success("Profile information updated successfully!");
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill out all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    
    setIsSavingPassword(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSavingPassword(false);
    
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Your password has been successfully updated.");
  };

  const handleAvatarSimulate = () => {
    const urls = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&auto=format&fit=crop"
    ];
    const nextUrl = urls[Math.floor(Math.random() * urls.length)];
    setAvatarUrl(nextUrl);
    
    if (user) {
      setUser({
        ...user,
        avatar_url: nextUrl
      });
    }
    toast.success("Avatar image updated!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar: Profile Summary */}
      <div className="lg:col-span-1 space-y-6">
        <SectionCard className="text-center overflow-hidden">
          <div className="relative mx-auto w-24 h-24 mb-4">
            <Avatar className="w-24 h-24 ring-4 ring-primary/10 shadow-lg mx-auto">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-2xl font-bold gradient-brand text-white">
                {fullName.split(" ").map((n) => n[0]).join("").slice(0, 2) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handleAvatarSimulate}
              type="button"
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center shadow-md transition-all scale-100 hover:scale-105 active:scale-95 cursor-pointer"
              title="Upload Photo (Simulated)"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <h3 className="font-bold text-base leading-tight">{fullName}</h3>
          <p className="text-xs text-muted-foreground mt-1 capitalize">{roleLabel}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
            {user?.organization?.name ?? "Apex Institute"}
          </div>

          <div className="border-t border-border mt-6 pt-6 text-left space-y-3">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Email</span>
              <p className="text-xs truncate font-medium mt-0.5">{email}</p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">User ID</span>
              <p className="text-xs font-mono truncate text-muted-foreground mt-0.5">{user?.id ?? "usr_demo123"}</p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Main Content: Form Editor */}
      <div className="lg:col-span-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted p-1 rounded-xl border mb-6 inline-flex">
            <TabsTrigger value="profile" className="gap-2 text-xs">
              <User className="w-4 h-4" /> Profile Info
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 text-xs">
              <Lock className="w-4 h-4" /> Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 text-xs">
              <Bell className="w-4 h-4" /> Notifications
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <SectionCard title="General Profile Information" description="Update your personal identification information and account bio.">
              <form onSubmit={handleProfileSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="e.g. john@example.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +1 (555) 000-0000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="roleDisplay">Role Assignment</Label>
                    <Input
                      id="roleDisplay"
                      value={roleLabel}
                      disabled
                      className="bg-muted font-medium capitalize"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bio">About Me / Bio</Label>
                  <textarea
                    id="bio"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                    placeholder="Tell us a little bit about yourself..."
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSaving} className="gap-2">
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Save Profile
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </SectionCard>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <SectionCard title="Authentication Settings" description="Keep your account secure by rotating your password regularly.">
              <form onSubmit={handlePasswordSave} className="space-y-6">
                <div className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end border-t border-border pt-4">
                  <Button type="submit" variant="default" disabled={isSavingPassword} className="gap-2">
                    {isSavingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" /> Change Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </SectionCard>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <SectionCard title="Notification Preferences" description="Manage when and how you receive alerts and summaries from the platform.">
              <div className="space-y-6">
                <div className="divide-y divide-border">
                  <div className="flex items-center justify-between py-4">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Email Alerts</Label>
                      <p className="text-xs text-muted-foreground">Receive attendance notifications and workflow task approvals via email.</p>
                    </div>
                    <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Real-time Push Notifications</Label>
                      <p className="text-xs text-muted-foreground">Receive prompt notifications directly inside your browser about account updates.</p>
                    </div>
                    <Switch checked={pushAlerts} onCheckedChange={setPushAlerts} />
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Weekly Attendance Digest</Label>
                      <p className="text-xs text-muted-foreground">A clean summary report of class attendance trends delivered every Friday.</p>
                    </div>
                    <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
                  </div>
                </div>

                <div className="flex justify-end border-t border-border pt-4">
                  <Button
                    onClick={() => {
                      toast.success("Notification preferences saved successfully.");
                    }}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Preferences
                  </Button>
                </div>
              </div>
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
