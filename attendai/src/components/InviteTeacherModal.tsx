"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, XCircle, Copy, Check } from "lucide-react";
import { invitationsApi, departmentsApi } from "@/lib/api";
import { toast } from "sonner";

interface Department {
  id: string;
  name: string;
  code: string;
}

interface InviteTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type InviteStatus = "idle" | "loading" | "success" | "error";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to send invitation";
}

export function InviteTeacherModal({ isOpen, onClose, onSuccess }: InviteTeacherModalProps) {
  const [departments, setDepartments] = useState<Department[]>([]);

  // Fetch real departments from the API when the modal opens
  useEffect(() => {
    if (!isOpen) return;
    departmentsApi.list().then((res) => {
      setDepartments(res.data ?? []);
    }).catch(() => {
      // silently fail — department dropdown will just be empty
    });
  }, [isOpen]);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    teacher_id: "",
    department_id: "",
    designation: "",
  });
  const [status, setStatus] = useState<InviteStatus>("idle");
  const [message, setMessage] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    setInviteLink(null);

    if (!formData.department_id) {
      setStatus("idle");
      toast.error("Please select the teacher's department.");
      return;
    }

    try {
      const result = await invitationsApi.inviteTeacher({
        full_name: formData.full_name,
        email: formData.email,
        teacher_id: formData.teacher_id,
        department_id: formData.department_id,
        designation: formData.designation || undefined,
      });
      setStatus("success");
      const link = result.data?.invite_link ?? null;
      const sent = result.data?.email_sent ?? false;
      setInviteLink(link);
      setEmailSent(sent);
      if (sent) {
        setMessage("Invitation email sent! The teacher will receive a link to set their password.");
        toast.success("Invitation email sent to teacher.");
      } else if (link) {
        setMessage("Invite link generated! Copy it and share with the teacher via WhatsApp or email.");
        toast.success("Invite link ready — copy and share with the teacher.");
      } else {
        setMessage("Invitation created in database. Configure Supabase email to auto-send invites.");
        toast.success("Invitation recorded.");
      }
      onSuccess?.();
    } catch (err: unknown) {
      setStatus("error");
      const errorMessage = getErrorMessage(err);
      setMessage(errorMessage);
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      teacher_id: "",
      department_id: "",
      designation: "",
    });
    setStatus("idle");
    setMessage("");
    setInviteLink(null);
    setEmailSent(false);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetForm()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite New Teacher</DialogTitle>
          <DialogDescription>
            Select the teacher&apos;s department, then create an invite link they can use to set their password.
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="py-6 space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-semibold mb-1">
                {emailSent ? "Invitation Email Sent! ✉️" : inviteLink ? "Invite Link Ready! 🔗" : "Invitation Recorded"}
              </h3>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
            {inviteLink && (
              <div className="bg-muted/60 border rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invite Link — Share with Teacher</p>
                <div className="flex gap-2">
                  <Input value={inviteLink} readOnly className="text-xs font-mono flex-1" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyLink}
                    className="shrink-0"
                    title="Copy link"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">📱 Share via WhatsApp, email, or any messaging app. The link expires in 7 days.</p>
              </div>
            )}
            <Button onClick={resetForm} className="btn-brand mt-4">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                disabled={status === "loading"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={status === "loading"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teacher_id">Teacher ID *</Label>
                <Input
                  id="teacher_id"
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  required
                  disabled={status === "loading"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="e.g. Assistant Professor"
                  disabled={status === "loading"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) => setFormData({ ...formData, department_id: value ?? "" })}
                disabled={status === "loading"}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {status === "error" && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg">
                <XCircle className="w-5 h-5" />
                <span className="text-sm">{message}</span>
              </div>
            )}

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={status === "loading"}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="btn-brand"
                disabled={status === "loading"}
              >
                {status === "loading" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
