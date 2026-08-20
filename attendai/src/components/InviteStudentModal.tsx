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
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { invitationsApi, departmentsApi } from "@/lib/api";
import { toast } from "sonner";

interface Department {
  id: string;
  name: string;
  code: string;
}

interface InviteStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type InviteStatus = "idle" | "loading" | "success" | "error";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to send invitation";
}

export function InviteStudentModal({ isOpen, onClose }: InviteStudentModalProps) {
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
    student_id: "",
    roll_number: "",
    department_id: "",
  });
  const [status, setStatus] = useState<InviteStatus>("idle");
  const [message, setMessage] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    setInviteLink(null);

    try {
      const result = await invitationsApi.inviteStudent({
        full_name: formData.full_name,
        email: formData.email,
        student_id: formData.student_id,
        roll_number: formData.roll_number,
        department_id: formData.department_id || undefined,
      });
      setStatus("success");
      setMessage("Invitation created! Copy the link below and send it to the student.");
      if (result.data?.invite_link) {
        setInviteLink(result.data.invite_link);
      }
      toast.success("Invite link ready — copy and share with the student.");
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
      student_id: "",
      roll_number: "",
      department_id: "",
    });
    setStatus("idle");
    setMessage("");
    setInviteLink(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetForm()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite New Student</DialogTitle>
          <DialogDescription>
            Creates an invite link you can share with the student so they can set their password.
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">{message}</h3>
              {inviteLink && (
                <div className="bg-muted rounded-lg p-3 mt-4">
                  <p className="text-xs text-muted-foreground mb-2 text-left">Invite Link (manual backup):</p>
                  <Input value={inviteLink} readOnly className="text-xs" />
                </div>
              )}
            </div>
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
                <Label htmlFor="student_id">Student ID *</Label>
                <Input
                  id="student_id"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  required
                  disabled={status === "loading"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roll_number">Roll Number *</Label>
                <Input
                  id="roll_number"
                  value={formData.roll_number}
                  onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                  required
                  disabled={status === "loading"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
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
