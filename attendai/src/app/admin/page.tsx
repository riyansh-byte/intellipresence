"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/ui/stats-card";
import { SectionCard } from "@/components/ui/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, GraduationCap, Clock, TrendingUp, CalendarCheck,
  UserPlus, FileText, Plus, ArrowRight, Zap, AlertTriangle, Building2, Mail
} from "lucide-react";
import { mockDashboardStats } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";
import { studentsApi, teachersApi, departmentsApi, invitationsApi } from "@/lib/api";

// ─────────────────────────────────────────
// Custom Chart Tooltip
// ─────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-card text-xs">
      <p className="font-medium mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Activity Icon
// ─────────────────────────────────────────

function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, { icon: React.ReactNode; bg: string }> = {
    attendance_marked: { icon: <CalendarCheck className="w-3.5 h-3.5" />, bg: "bg-success/10 text-success" },
    student_added: { icon: <UserPlus className="w-3.5 h-3.5" />, bg: "bg-brand-500/10 text-brand-500" },
    report_generated: { icon: <FileText className="w-3.5 h-3.5" />, bg: "bg-emerald-500/10 text-emerald-600" },
    leave_approved: { icon: <CalendarCheck className="w-3.5 h-3.5" />, bg: "bg-warning/10 text-warning" },
    session_created: { icon: <Zap className="w-3.5 h-3.5" />, bg: "bg-info/10 text-info" },
  };
  const config = icons[type] ?? icons.attendance_marked;
  return (
    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", config.bg)}>
      {config.icon}
    </div>
  );
}

// ─────────────────────────────────────────
// Quick Action Button
// ─────────────────────────────────────────

function QuickAction({
  icon,
  label,
  href,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:shadow-card-hover transition-all duration-200 cursor-pointer"
      >
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
          {icon}
        </div>
        <span className="text-xs font-medium text-center leading-tight">{label}</span>
      </motion.div>
    </Link>
  );
}

// ─────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [liveStudents, setLiveStudents] = useState<any[]>([]);
  const [liveTeachers, setLiveTeachers] = useState<any[]>([]);
  const [liveDepartments, setLiveDepartments] = useState<any[]>([]);
  const [liveInvitations, setLiveInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    async function fetchLiveData() {
      try {
        const [sRes, tRes, dRes, iRes] = await Promise.allSettled([
          studentsApi.list() as any,
          teachersApi.list() as any,
          departmentsApi.list() as any,
          invitationsApi.list() as any,
        ]);
        if (sRes.status === "fulfilled") setLiveStudents(sRes.value?.data || []);
        if (tRes.status === "fulfilled") setLiveTeachers(tRes.value?.data || []);
        if (dRes.status === "fulfilled") setLiveDepartments(dRes.value?.data || []);
        if (iRes.status === "fulfilled") setLiveInvitations(iRes.value?.data || []);
      } catch (err) {
        console.error("Error fetching live dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLiveData();
  }, []);

  const stats = mockDashboardStats;
  const today = new Date();
  const greeting = mounted
    ? today.getHours() < 12
      ? "morning"
      : today.getHours() < 17
      ? "afternoon"
      : "evening"
    : "day";

  const formattedDate = mounted ? format(today, "EEEE, MMMM d, yyyy") : "";

  const trendData = stats.weekly_trend.slice(-14).map((t) => ({
    ...t,
    date: format(new Date(t.date), "MMM d"),
  }));
  const deptData = liveDepartments.length > 0 
    ? liveDepartments.map(d => ({ department_name: d.name, percentage: d.student_count || 85 }))
    : stats.department_comparison;

  const riskStudents = liveStudents.filter((s) => (s.attendance_percentage ?? 100) < 75).slice(0, 5);

  return (
    <DashboardLayout
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      {/* ── Hero greeting ── */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Good {greeting}, Admin! 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {formattedDate} — Here's what's happening today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/attendance">
              <Button size="sm" className="btn-brand gap-1.5">
                <CalendarCheck className="w-4 h-4" />
                Mark Attendance
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button size="sm" variant="outline" className="gap-1.5">
                <FileText className="w-4 h-4 mr-1.5" />
                Generate Report
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Enrolled Students"
          value={liveStudents.length}
          subtitle={`across ${liveDepartments.length} departments`}
          icon={<Users className="w-5 h-5" />}
          variant="primary"
          delay={0}
        />
        <StatsCard
          title="Active Teachers"
          value={liveTeachers.length}
          subtitle="Faculty members"
          icon={<GraduationCap className="w-5 h-5" />}
          variant="success"
          delay={0.05}
        />
        <StatsCard
          title="Departments"
          value={liveDepartments.length}
          subtitle="Academic units"
          icon={<Building2 className="w-5 h-5" />}
          variant="warning"
          delay={0.1}
        />
        <StatsCard
          title="Pending Invites"
          value={liveInvitations.length}
          subtitle="Awaiting activation"
          icon={<Mail className="w-5 h-5" />}
          variant="danger"
          delay={0.15}
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left column (2/3) */}
        <div className="xl:col-span-2 space-y-6">

          {/* Attendance Trend Chart */}
          <SectionCard
            title="Attendance Trend"
            description="Last 14 days"
            action={
              <Link href="/admin/analytics" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                View analytics <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            }
          >
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-present" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160,84%,39%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(160,84%,39%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-absent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(347,77%,50%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(347,77%,50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="present" stroke="hsl(160,84%,39%)" strokeWidth={2} fill="url(#grad-present)" dot={false} />
                <Area type="monotone" dataKey="absent" stroke="hsl(347,77%,50%)" strokeWidth={2} fill="url(#grad-absent)" dot={false} />
                <Area type="monotone" dataKey="late" stroke="hsl(38,92%,50%)" strokeWidth={2} fill="none" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Department Comparison */}
          <SectionCard
            title="Department Comparison"
            description="Attendance % by department"
          >
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={deptData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="department_name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Quick Actions */}
          <SectionCard title="Quick Actions">
            <div className="grid grid-cols-4 gap-3">
              <QuickAction icon={<CalendarCheck className="w-5 h-5 text-success" />} label="Mark Attendance" href="/admin/attendance" color="bg-success/10" />
              <QuickAction icon={<UserPlus className="w-5 h-5 text-brand-500" />} label="Add Student" href="/admin/students" color="bg-brand-500/10" />
              <QuickAction icon={<FileText className="w-5 h-5 text-emerald-600" />} label="Generate Report" href="/admin/reports" color="bg-emerald-500/10" />
              <QuickAction icon={<GraduationCap className="w-5 h-5 text-warning" />} label="Add Teacher" href="/admin/teachers" color="bg-warning/10" />
            </div>
          </SectionCard>
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-6">

          {/* Today's Overview Donut-style */}
          <SectionCard title="Today's Overview">
            <div className="space-y-3">
              {[
                { label: "Present", value: stats.today.present, total: stats.today.total, color: "bg-success" },
                { label: "Absent", value: stats.today.absent, total: stats.today.total, color: "bg-danger" },
                { label: "Late", value: stats.today.late, total: stats.today.total, color: "bg-warning" },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">
                      {item.value} <span className="text-muted-foreground font-normal">/ {item.total}</span>
                    </span>
                  </div>
                  <Progress
                    value={(item.value / item.total) * 100}
                    className="h-1.5"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Overall rate</span>
              <span className="text-2xl font-bold gradient-text">{stats.today.percentage}%</span>
            </div>
          </SectionCard>

          {/* Risk Students */}
          <SectionCard
            title="At-Risk Students"
            description="Attendance below 75%"
            action={
              <Link href="/admin/students" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                View all
              </Link>
            }
          >
            <div className="space-y-3">
              {riskStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No at-risk students 🎉
                </p>
              ) : (
                riskStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={student.avatar_url} />
                      <AvatarFallback className="text-xs bg-muted">
                        {student.full_name.split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{student.full_name}</p>
                      <p className="text-xs text-muted-foreground">{student.roll_number}</p>
                    </div>
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      (student.attendance_percentage ?? 0) < 60
                        ? "text-danger bg-danger/10"
                        : "text-warning bg-warning/10"
                    )}>
                      {student.attendance_percentage}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

          {/* Recent Activity */}
          <SectionCard
            title="Recent Activity"
            action={
              <Link href="/admin/audit-logs" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                View all
              </Link>
            }
          >
            <div className="space-y-3">
              {stats.recent_activities.slice(0, 5).map((activity, i) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <ActivityIcon type={activity.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug">{activity.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {activity.actor} · {format(new Date(activity.timestamp), "MMM d, h:mm a")}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
