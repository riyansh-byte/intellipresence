"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockTeachers, mockDepartments, mockStudents } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import {
  Search, Plus, MoreHorizontal, Eye, Pencil, Trash2,
  Download, GraduationCap, X, Users, TrendingUp,
  Mail, Hash, User, BookOpen, Save, BarChart3,
  CheckCircle2, XCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Teacher } from "@/types";
import { InviteTeacherModal } from "@/components/InviteTeacherModal";
import { teachersApi, departmentsApi } from "@/lib/api";
import { toast } from "sonner";

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function getDeptName(id: string, depts?: any[]) {
  const list = depts && depts.length > 0 ? depts : mockDepartments;
  return list.find((d) => d.id === id)?.name ?? "Unknown";
}

/** Derive mock class attendance stats for a teacher */
function getTeacherStats(teacher: Teacher, depts?: any[]) {
  // Students in same dept = teacher's "class"
  const deptStudents = mockStudents.filter((s) => s.department_id === teacher.department_id);
  const totalStudents = deptStudents.length;

  // Simulate class sessions
  const classes = [
    {
      name: `${getDeptName(teacher.department_id, depts).split(" ")[0]} 101`,
      totalStudents: Math.ceil(totalStudents * 0.5),
      present: Math.ceil(totalStudents * 0.5 * 0.85),
    },
    {
      name: `${getDeptName(teacher.department_id, depts).split(" ")[0]} 201`,
      totalStudents: Math.ceil(totalStudents * 0.3),
      present: Math.ceil(totalStudents * 0.3 * 0.78),
    },
    {
      name: `${getDeptName(teacher.department_id, depts).split(" ")[0]} 301`,
      totalStudents: Math.ceil(totalStudents * 0.2),
      present: Math.ceil(totalStudents * 0.2 * 0.91),
    },
  ];

  const totalPresent = classes.reduce((a, c) => a + c.present, 0);
  const totalEnrolled = classes.reduce((a, c) => a + c.totalStudents, 0);
  const overallPct = totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 0;

  return { classes, totalEnrolled, totalPresent, overallPct, deptStudents };
}

// ─────────────────────────────────────────
// Teacher Profile Modal
// ─────────────────────────────────────────

function TeacherProfileModal({ teacher, onClose, depts }: { teacher: Teacher; onClose: () => void; depts?: any[] }) {
  const stats = getTeacherStats(teacher, depts);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] overflow-y-auto"
      >
        {/* Header gradient banner */}
        <div className="h-20 bg-gradient-to-r from-emerald-600 to-teal-600 relative shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 text-white hover:bg-white/20 h-7 w-7"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="-mt-10 mb-4 flex items-end gap-4">
            <Avatar className="w-20 h-20 ring-4 ring-card shadow-xl">
              <AvatarImage src={teacher.avatar_url} />
              <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                {teacher.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <h2 className="text-lg font-bold">{teacher.full_name}</h2>
              <p className="text-xs text-muted-foreground">{teacher.designation ?? "Faculty Member"}</p>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { icon: Hash, label: "Employee ID", value: teacher.employee_id },
              { icon: User, label: "Department", value: getDeptName(teacher.department_id, depts) },
              { icon: Mail, label: "Email", value: teacher.email ?? "—" },
              { icon: BookOpen, label: "Designation", value: teacher.designation ?? "Faculty Member" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-muted/40 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{label}</span>
                </div>
                <p className="text-sm font-medium truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Overall attendance stat */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Class Attendance Overview
            </h3>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Total Students", value: stats.totalEnrolled, icon: Users, color: "text-foreground" },
                { label: "Attending", value: stats.totalPresent, icon: CheckCircle2, color: "text-success" },
                { label: "Absent", value: stats.totalEnrolled - stats.totalPresent, icon: XCircle, color: "text-danger" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-card/60 rounded-lg p-3 text-center">
                  <Icon className={cn("w-4 h-4 mx-auto mb-1", color)} />
                  <p className={cn("text-xl font-bold", color)}>{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Overall class attendance rate</span>
              <span className={cn(
                "text-sm font-bold",
                stats.overallPct >= 75 ? "text-success" : stats.overallPct >= 60 ? "text-warning" : "text-danger"
              )}>
                {stats.overallPct}%
              </span>
            </div>
            <Progress value={stats.overallPct} className="h-2" />
          </div>

          {/* Per-class breakdown */}
          <div className="bg-muted/40 rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Class-wise Breakdown
            </h3>
            <div className="space-y-3">
              {stats.classes.map((cls) => {
                const pct = cls.totalStudents > 0
                  ? Math.round((cls.present / cls.totalStudents) * 100)
                  : 0;
                return (
                  <div key={cls.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{cls.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {cls.present}/{cls.totalStudents} attending
                        </span>
                      </div>
                      <span className={cn(
                        "text-xs font-bold",
                        pct >= 75 ? "text-success" : pct >= 60 ? "text-warning" : "text-danger"
                      )}>
                        {pct}%
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div className="mt-4">
            <span className={cn(
              "text-xs font-medium px-3 py-1 rounded-full",
              teacher.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
            )}>
              {teacher.is_active ? "● Active" : "● Inactive"}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────
// Edit Teacher Modal
// ─────────────────────────────────────────

function EditTeacherModal({ teacher, onClose, depts }: { teacher: Teacher; onClose: () => void; depts?: any[] }) {
  const [form, setForm] = useState({
    full_name: teacher.full_name,
    email: teacher.email ?? "",
    designation: teacher.designation ?? "",
    department_id: teacher.department_id,
  });

  const departmentList = depts && depts.length > 0 ? depts : mockDepartments;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-10"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold">Edit Teacher</h2>
            <p className="text-xs text-muted-foreground">{teacher.employee_id}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          {[
            { label: "Full Name", key: "full_name", type: "text" },
            { label: "Email", key: "email", type: "email" },
            { label: "Designation", key: "designation", type: "text" },
          ].map(({ label, key, type }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
              <Input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="h-9"
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Department</label>
            <Select
              value={form.department_id}
              onValueChange={(v) => v && setForm((f) => ({ ...f, department_id: v }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departmentList.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 btn-brand gap-2" onClick={onClose}>
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────

export default function TeachersPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState(() => {
    if (typeof window === "undefined") return "all";
    return new URLSearchParams(window.location.search).get("department") ?? "all";
  });
  const [profileTeacher, setProfileTeacher] = useState<Teacher | null>(null);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTeachers = async () => {
    try {
      setIsLoading(true);
      const res = await teachersApi.list() as any;
      if (res && res.data && res.data.length > 0) {
        const mapped = res.data.map((t: any) => ({
          id: t.id,
          created_at: t.created_at,
          updated_at: t.updated_at,
          organization_id: t.organization_id,
          user_id: t.profile_id || "",
          employee_id: t.teacher_id || "",
          full_name: t.full_name,
          email: t.email,
          department_id: t.department_id,
          designation: t.designation || "",
          is_active: t.is_active,
          department: t.department,
        }));
        setTeachers(mapped);
      } else {
        setTeachers([]);
      }
    } catch (err) {
      console.error("Failed to fetch teachers from API:", err);
      setTeachers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await departmentsApi.list();
      setDepartments(res?.data || []);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
      setDepartments([]);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchDepartments();
  }, []);

  const filtered = useMemo(() => {
    return teachers.filter((t) => {
      const matchSearch =
        !search ||
        t.full_name.toLowerCase().includes(search.toLowerCase()) ||
        t.employee_id.toLowerCase().includes(search.toLowerCase()) ||
        t.email?.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === "all" || t.department_id === deptFilter;
      return matchSearch && matchDept;
    });
  }, [teachers, search, deptFilter]);

  return (
    <DashboardLayout
      breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Teachers" }]}
    >
      <PageHeader
        title="Teachers"
        description={`${teachers.length} faculty members active across ${departments.length} departments`}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="w-4 h-4" />
              Export Directory
            </Button>
            <Button size="sm" className="btn-brand gap-1.5" onClick={() => setIsInviteModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Invite Teacher
            </Button>
          </>
        }
      />

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 mb-5"
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search teachers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={deptFilter} onValueChange={(v) => v && setDeptFilter(v)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border bg-card shadow-card overflow-hidden"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className="text-sm">Loading teachers...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Teacher</TableHead>
                <TableHead>Teacher ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Class Attendance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <GraduationCap className="w-8 h-8 opacity-40" />
                      <p className="text-sm">No teachers found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((teacher, i) => {
                  const stats = getTeacherStats(teacher, departments);
                  return (
                    <motion.tr
                      key={teacher.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={teacher.avatar_url} />
                            <AvatarFallback className="text-xs bg-brand-100 text-brand-700">
                              {teacher.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{teacher.full_name}</p>
                            <p className="text-xs text-muted-foreground">{teacher.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">
                        {teacher.employee_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {teacher.department?.code ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {teacher.designation ?? "Faculty Member"}
                      </TableCell>
                      {/* Class attendance mini-stat */}
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs text-muted-foreground">
                                {stats.totalPresent}/{stats.totalEnrolled}
                              </span>
                              <span className={cn(
                                "text-xs font-semibold",
                                stats.overallPct >= 75 ? "text-success" : stats.overallPct >= 60 ? "text-warning" : "text-danger"
                              )}>
                                {stats.overallPct}%
                              </span>
                            </div>
                            <Progress value={stats.overallPct} className="h-1.5" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          teacher.is_active
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {teacher.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setProfileTeacher(teacher)}>
                              <Eye className="mr-2 h-4 w-4" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditTeacher(teacher)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-danger focus:text-danger">
                              <Trash2 className="mr-2 h-4 w-4" /> Remove Teacher
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {teachers.length} teachers
          </p>
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {profileTeacher && (
          <TeacherProfileModal
            teacher={profileTeacher}
            onClose={() => setProfileTeacher(null)}
            depts={departments}
          />
        )}
        {editTeacher && (
          <EditTeacherModal
            teacher={editTeacher}
            onClose={() => setEditTeacher(null)}
            depts={departments}
          />
        )}
      </AnimatePresence>
      <InviteTeacherModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={fetchTeachers}
      />
    </DashboardLayout>
  );
}
