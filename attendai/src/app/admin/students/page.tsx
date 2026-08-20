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
import { AttendancePctBadge } from "@/components/ui/attendance-badge";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { studentsApi, departmentsApi } from "@/lib/api";
import {
  Search, Plus, MoreHorizontal, Eye, Pencil, Trash2,
  Download, Upload, GraduationCap, LayoutList, LayoutGrid,
  X, CalendarCheck, TrendingUp, AlertTriangle, ChevronDown, ChevronRight,
  Mail, Hash, User, BookOpen, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Department, Student } from "@/types";
import { InviteStudentModal } from "@/components/InviteStudentModal";

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function getDeptName(id: string, departments: Department[]) {
  return departments.find((d) => d.id === id)?.name ?? "Unknown";
}

// Fake per-student attendance breakdown (since we only have overall %)
function getAttendanceBreakdown(student: Student) {
  const pct = student.attendance_percentage ?? 75;
  const total = 120;
  const present = Math.round((pct / 100) * total);
  const absent = Math.round(((100 - pct) * 0.7 / 100) * total);
  const late = total - present - absent;
  return {
    total,
    present,
    absent,
    late: Math.max(0, late),
    monthly: [
      { month: "Jan", pct: Math.min(100, pct + Math.floor(Math.random() * 10) - 5) },
      { month: "Feb", pct: Math.min(100, pct + Math.floor(Math.random() * 10) - 5) },
      { month: "Mar", pct: Math.min(100, pct + Math.floor(Math.random() * 10) - 5) },
      { month: "Apr", pct: Math.min(100, pct + Math.floor(Math.random() * 10) - 5) },
    ],
  };
}

// ─────────────────────────────────────────
// Student Profile Modal
// ─────────────────────────────────────────

function StudentProfileModal({ student, departments, onClose }: { student: Student; departments: Department[]; onClose: () => void }) {
  const breakdown = getAttendanceBreakdown(student);
  const pct = student.attendance_percentage ?? 0;
  const status = pct >= 75 ? "good" : pct >= 60 ? "warning" : "danger";

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
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-10"
      >
        {/* Header gradient banner */}
        <div className="h-20 gradient-brand relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 text-white hover:bg-white/20 h-7 w-7"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Avatar overlapping banner */}
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-4 flex items-end gap-4">
            <Avatar className="w-20 h-20 ring-4 ring-card shadow-xl">
              <AvatarImage src={student.avatar_url} />
              <AvatarFallback className="text-xl font-bold gradient-brand text-white">
                {student.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <h2 className="text-lg font-bold">{student.full_name}</h2>
              <p className="text-xs text-muted-foreground">{student.email}</p>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { icon: Hash, label: "Student ID", value: student.student_id },
              { icon: BookOpen, label: "Roll Number", value: student.roll_number },
              { icon: User, label: "Department", value: getDeptName(student.department_id, departments) },
              { icon: Mail, label: "Email", value: student.email ?? "—" },
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

          {/* Attendance summary */}
          <div className="bg-muted/40 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-primary" />
              Attendance Overview
            </h3>

            {/* Overall % */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Overall Attendance</span>
              <span className={cn(
                "text-lg font-bold",
                status === "good" ? "text-success" : status === "warning" ? "text-warning" : "text-danger"
              )}>
                {pct}%
              </span>
            </div>
            <Progress value={pct} className="h-2 mb-4" />

            {/* Breakdown cards */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Present", value: breakdown.present, color: "text-success", bg: "bg-success/10" },
                { label: "Absent", value: breakdown.absent, color: "text-danger", bg: "bg-danger/10" },
                { label: "Late", value: breakdown.late, color: "text-warning", bg: "bg-warning/10" },
              ].map((item) => (
                <div key={item.label} className={cn("rounded-lg p-2.5 text-center", item.bg)}>
                  <p className={cn("text-xl font-bold", item.color)}>{item.value}</p>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly trend bars */}
          <div className="bg-muted/40 rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Monthly Trend
            </h3>
            <div className="flex items-end gap-2 h-16">
              {breakdown.monthly.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-sm bg-primary/70"
                    style={{ height: `${(m.pct / 100) * 52}px` }}
                  />
                  <span className="text-[9px] text-muted-foreground">{m.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status badge */}
          <div className="mt-4 flex items-center justify-between">
            <span className={cn(
              "text-xs font-medium px-3 py-1 rounded-full",
              student.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
            )}>
              {student.is_active ? "● Active" : "● Inactive"}
            </span>
            {pct < 75 && (
              <span className="flex items-center gap-1 text-xs text-danger font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                Below 75% threshold
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────
// Edit Student Modal
// ─────────────────────────────────────────

function EditStudentModal({ student, departments, onClose }: { student: Student; departments: Department[]; onClose: () => void }) {
  const [form, setForm] = useState({
    full_name: student.full_name,
    email: student.email ?? "",
    roll_number: student.roll_number,
    department_id: student.department_id,
  });

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
            <h2 className="text-base font-semibold">Edit Student</h2>
            <p className="text-xs text-muted-foreground">{student.student_id}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          {[
            { label: "Full Name", key: "full_name", type: "text" },
            { label: "Email", key: "email", type: "email" },
            { label: "Roll Number", key: "roll_number", type: "text" },
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
                {departments.map((d) => (
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
// Department Group (accordion row)
// ─────────────────────────────────────────

function DeptGroup({
  dept,
  students,
  onViewProfile,
  onEditStudent,
}: {
  dept: Department;
  students: Student[];
  onViewProfile: (s: Student) => void;
  onEditStudent: (s: Student) => void;
}) {
  const [open, setOpen] = useState(true);
  const avgPct = students.length
    ? Math.round(students.reduce((a, s) => a + (s.attendance_percentage ?? 0), 0) / students.length)
    : 0;

  return (
    <div className="border border-border rounded-xl overflow-hidden mb-3">
      {/* Dept header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
      >
        {open
          ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        }
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-semibold">{dept.name}</span>
          <Badge variant="outline" className="text-xs shrink-0">{dept.code}</Badge>
        </div>
        <div className="flex items-center gap-4 shrink-0 text-xs text-muted-foreground">
          <span>{students.length} students</span>
          <span className={cn(
            "font-semibold",
            avgPct >= 75 ? "text-success" : avgPct >= 60 ? "text-warning" : "text-danger"
          )}>
            Avg {avgPct}%
          </span>
        </div>
      </button>

      {/* Students table */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead>Student</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student, i) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={student.avatar_url} />
                          <AvatarFallback className="text-xs bg-brand-100 text-brand-700">
                            {student.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{student.full_name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {student.student_id}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {student.roll_number}
                    </TableCell>
                    <TableCell>
                      <AttendancePctBadge pct={student.attendance_percentage ?? 0} />
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        student.is_active
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {student.is_active ? "Active" : "Inactive"}
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
                          <DropdownMenuItem onClick={() => onViewProfile(student)}>
                            <Eye className="mr-2 h-4 w-4" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditStudent(student)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-danger focus:text-danger">
                            <Trash2 className="mr-2 h-4 w-4" /> Remove Student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────

export default function StudentsPage() {
  const initialDepartment = () => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("department");
  };

  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState(() => initialDepartment() ?? "all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "department">(
    initialDepartment() ? "list" : "department"
  );
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const fetchStudentsData = async () => {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        studentsApi.list() as any,
        departmentsApi.list() as any,
      ]);
      setStudents(sRes?.data || []);
      setDepartments(dRes?.data || []);
    } catch (err) {
      console.error("Failed to load students/departments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsData();
  }, []);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        !search ||
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.student_id.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === "all" || s.department_id === deptFilter;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && s.is_active) ||
        (statusFilter === "inactive" && !s.is_active);
      return matchSearch && matchDept && matchStatus;
    });
  }, [students, search, deptFilter, statusFilter]);

  // Group by department
  const byDept = useMemo(() => {
    return departments
      .filter((d) => deptFilter === "all" || d.id === deptFilter)
      .map((d) => ({
        dept: d,
        students: filtered.filter((s) => s.department_id === d.id),
      }));
  }, [departments, filtered, deptFilter]);

  return (
    <DashboardLayout
      breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Students" }]}
    >
      <PageHeader
        title="Students"
        description={`${students.length} students enrolled across ${departments.length} departments`}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Upload className="w-4 h-4" />
              Import CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button size="sm" className="btn-brand gap-1.5" onClick={() => setIsInviteModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Invite Student
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
            placeholder="Search students..."
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
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 gap-0.5 shrink-0">
          <button
            onClick={() => setViewMode("department")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              viewMode === "department"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            By Dept
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              viewMode === "list"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutList className="w-3.5 h-3.5" />
            List
          </button>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        {viewMode === "department" ? (
          // ── Department-wise grouped view ──
          byDept.length === 0 ? (
            <div className="rounded-xl border bg-card shadow-card flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <GraduationCap className="w-8 h-8 opacity-40" />
              <p className="text-sm">No students found</p>
            </div>
          ) : (
            byDept.map(({ dept, students }) => (
              <DeptGroup
                key={dept.id}
                dept={dept}
                students={students}
                onViewProfile={setProfileStudent}
                onEditStudent={setEditStudent}
              />
            ))
          )
        ) : (
          // ── Flat list view ──
          <div className="rounded-xl border bg-card shadow-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Student</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Attendance</TableHead>
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
                        <p className="text-sm">No students found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((student, i) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={student.avatar_url} />
                            <AvatarFallback className="text-xs bg-brand-100 text-brand-700">
                              {student.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{student.full_name}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">
                        {student.student_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {student.department?.code ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">
                        {student.roll_number}
                      </TableCell>
                      <TableCell>
                        <AttendancePctBadge pct={student.attendance_percentage ?? 0} />
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          student.is_active
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {student.is_active ? "Active" : "Inactive"}
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
                            <DropdownMenuItem onClick={() => setProfileStudent(student)}>
                              <Eye className="mr-2 h-4 w-4" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditStudent(student)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-danger focus:text-danger">
                              <Trash2 className="mr-2 h-4 w-4" /> Remove Student
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Showing {filtered.length} of {students.length} students
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {profileStudent && (
          <StudentProfileModal
            student={profileStudent}
            departments={departments}
            onClose={() => setProfileStudent(null)}
          />
        )}
        {editStudent && (
          <EditStudentModal
            student={editStudent}
            departments={departments}
            onClose={() => setEditStudent(null)}
          />
        )}
      </AnimatePresence>
      <InviteStudentModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </DashboardLayout>
  );
}
