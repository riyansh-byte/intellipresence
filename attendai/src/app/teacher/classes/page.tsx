"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, SectionCard } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, BookOpen, Clock, Users, ArrowRight, Activity, Percent } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const classesList = [
  {
    id: "c1",
    code: "CS301",
    name: "Algorithms & Complexities",
    schedule: "Mon, Wed, Fri — 09:00 AM to 10:30 AM",
    room: "Room 402",
    studentsCount: 48,
    avgAttendance: 94.2,
    department: "Computer Science",
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    id: "c2",
    code: "CS302",
    name: "Database Management Systems",
    schedule: "Tue, Thu — 11:00 AM to 12:30 PM",
    room: "Lab 3",
    studentsCount: 45,
    avgAttendance: 88.5,
    department: "Computer Science",
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    id: "c3",
    code: "CS305",
    name: "Software Engineering Principles",
    schedule: "Mon, Wed — 01:30 PM to 03:00 PM",
    room: "Room 401",
    studentsCount: 52,
    avgAttendance: 91.8,
    department: "Computer Science",
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    id: "c4",
    code: "CS412",
    name: "Artificial Intelligence & Heuristics",
    schedule: "Tue, Fri — 03:30 PM to 05:00 PM",
    room: "Room 205",
    studentsCount: 38,
    avgAttendance: 96.1,
    department: "Computer Science",
    color: "from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
];

export default function TeacherClassesPage() {
  return (
    <DashboardLayout
      role="teacher"
      breadcrumbs={[{ label: "Dashboard", href: "/teacher" }, { label: "Classes" }]}
    >
      <PageHeader
        title="My Classes"
        description="Manage and review stats, schedule timings, and attendance checklists for your assigned classes."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classesList.map((cls, idx) => (
          <motion.div
            key={cls.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className={`rounded-xl border bg-gradient-to-br ${cls.color} border-border p-6 flex flex-col justify-between shadow-card hover:shadow-md transition-all`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="mb-2 bg-background font-medium">
                    {cls.code}
                  </Badge>
                  <h3 className="text-lg font-bold text-foreground leading-snug">{cls.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{cls.department}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-background border flex items-center justify-center shadow-sm">
                  <BookOpen className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2.5 text-sm text-foreground">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{cls.schedule}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-foreground">
                  <Activity className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>Room: <strong className="font-semibold">{cls.room}</strong></span>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-border/60 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Students</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-bold">{cls.studentsCount}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Avg Attendance</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Percent className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-bold text-foreground">{cls.avgAttendance}%</span>
                  </div>
                </div>
              </div>

              <Link href="/teacher/attendance">
                <Button size="sm" className="gap-1.5 shadow-sm">
                  Roll Call <ArrowRight className="w-4.5 h-4.5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </DashboardLayout>
  );
}
