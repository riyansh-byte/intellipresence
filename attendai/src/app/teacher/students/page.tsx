"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AttendancePctBadge } from "@/components/ui/attendance-badge";
import { mockStudents } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Search, GraduationCap, Plus } from "lucide-react";
import { InviteStudentModal } from "@/components/InviteStudentModal";

export default function TeacherStudentsPage() {
  const [search, setSearch] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const filtered = useMemo(() => {
    return mockStudents.filter((s) => {
      const matchSearch =
        !search ||
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.student_id.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [search]);

  return (
    <DashboardLayout
      breadcrumbs={[{ label: "Teacher Portal", href: "/teacher" }, { label: "Students" }]}
      role="teacher"
    >
      <PageHeader
        title="My Students"
        description="Directory list of students registered under your active teaching courses"
        actions={
          <Button size="sm" className="btn-brand gap-1.5" onClick={() => setIsInviteModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Invite Student
          </Button>
        }
      />

      <div className="relative max-w-sm mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search student directories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border bg-card rounded-2xl shadow-card overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Student Name</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Roll Number</TableHead>
              <TableHead>Avg Attendance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <GraduationCap className="w-8 h-8 opacity-40" />
                    <p className="text-sm">No students assigned</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((student, i) => (
                <motion.tr
                  key={student.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
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
                        <p className="text-xs font-semibold">{student.full_name}</p>
                        <p className="text-[10px] text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {student.student_id}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-mono font-semibold">
                      {student.department?.code ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {student.roll_number}
                  </TableCell>
                  <TableCell>
                    <AttendancePctBadge pct={student.attendance_percentage ?? 0} />
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>

        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
          <span>Showing {filtered.length} students</span>
        </div>
      </motion.div>
      <InviteStudentModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </DashboardLayout>
  );
}
