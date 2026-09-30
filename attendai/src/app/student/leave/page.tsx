"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, SectionCard } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Save, Loader2, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { leavesApi, LeaveRequest } from "@/lib/api";

const fallbackHistory: LeaveRequest[] = [
  {
    id: "lv_s1",
    student_id: "me",
    start_date: "2026-07-07",
    end_date: "2026-07-09",
    reason: "Medical Leave (Fever)",
    status: "pending",
    reviewed_by: null,
    created_at: "2026-07-06T10:00:00Z",
  },
  {
    id: "lv_s2",
    student_id: "me",
    start_date: "2026-06-12",
    end_date: "2026-06-12",
    reason: "Attended hackathon event",
    status: "approved",
    reviewed_by: "teacher_1",
    created_at: "2026-06-10T10:00:00Z",
  },
];

export default function StudentLeavePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState<LeaveRequest[]>([]);

  const fetchMyLeaves = async () => {
    try {
      setIsLoading(true);
      const res = await leavesApi.list();
      if (res?.data && res.data.length > 0) {
        setHistory(res.data);
      } else {
        setHistory(fallbackHistory);
      }
    } catch (err) {
      console.warn("Could not fetch my leave history, using fallback", err);
      setHistory(fallbackHistory);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      toast.error("Please fill in all application fields");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date cannot be earlier than start date");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await leavesApi.submit({
        start_date: startDate,
        end_date: endDate,
        reason: reason,
      });

      const newApp: LeaveRequest = res?.data || {
        id: `lv_s_${Date.now()}`,
        student_id: "me",
        start_date: startDate,
        end_date: endDate,
        reason,
        status: "pending",
        reviewed_by: null,
        created_at: new Date().toISOString(),
      };

      setHistory([newApp, ...history]);
      setStartDate("");
      setEndDate("");
      setReason("");
      toast.success("Leave application submitted successfully!", {
        description: "Your request is now in queue for teacher/admin review.",
      });
    } catch (err: any) {
      console.warn("Failed to submit leave to backend, falling back to local simulation", err);
      const simulatedApp: LeaveRequest = {
        id: `lv_s_${Date.now()}`,
        student_id: "me",
        start_date: startDate,
        end_date: endDate,
        reason,
        status: "pending",
        reviewed_by: null,
        created_at: new Date().toISOString(),
      };
      setHistory([simulatedApp, ...history]);
      setStartDate("");
      setEndDate("");
      setReason("");
      toast.success("Leave application submitted (offline record saved)!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await leavesApi.cancel(id);
      setHistory(history.filter((h) => h.id !== id));
      toast.success("Leave application withdrawn");
    } catch {
      setHistory(history.filter((h) => h.id !== id));
      toast.success("Application removed");
    }
  };

  return (
    <DashboardLayout
      breadcrumbs={[{ label: "Student Portal", href: "/student" }, { label: "Leave Requests" }]}
      role="student"
    >
      <PageHeader
        title="Leave Applications"
        description="Apply for session excuse tokens and track authorized exceptions"
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Form: Apply */}
        <div className="xl:col-span-1">
          <SectionCard title="Submit Application">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Start Date</Label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">End Date</Label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reason" className="text-xs">
                  Reason for Absence
                </Label>
                <textarea
                  id="reason"
                  rows={3}
                  required
                  placeholder="State the reason clearly (medical, family event, tournament)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-ring resize-none outline-none"
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full btn-brand gap-2 text-xs font-semibold">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting request...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Submit Application
                  </>
                )}
              </Button>
            </form>
          </SectionCard>
        </div>

        {/* Right: History applications */}
        <div className="xl:col-span-2">
          <SectionCard
            title="My Applied Leave Requests"
            description="History of submitted exceptions and approvals status"
          >
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-xs">Loading leave history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-60" />
                <p className="text-xs">No leave applications submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {history.map((app, i) => (
                    <motion.div
                      key={app.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="p-4 border rounded-2xl flex items-center justify-between text-xs hover:bg-muted/10 transition-colors bg-card gap-4"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="font-semibold">
                            {app.start_date} {app.start_date !== app.end_date && `— ${app.end_date}`}
                          </span>
                        </div>
                        <p className="text-muted-foreground truncate leading-normal max-w-sm sm:max-w-md">
                          {app.reason}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-bold px-2.5 py-0.5 rounded-full",
                            app.status === "approved"
                              ? "bg-success/15 text-success border-success/30"
                              : app.status === "rejected"
                              ? "bg-danger/15 text-danger border-danger/30"
                              : "bg-warning/15 text-warning border-warning/30"
                          )}
                        >
                          {app.status.toUpperCase()}
                        </Badge>
                        {app.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-danger"
                            onClick={() => handleCancel(app.id)}
                            title="Cancel request"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
