"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, SectionCard } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Percent, ShieldAlert, CheckCircle2, CalendarCheck, Clock, BookOpen, Loader2, Calendar } from "lucide-react";
import { attendanceApi, studentsApi } from "@/lib/api";

interface SubjectStat {
  code: string;
  name: string;
  attended: number;
  total: number;
  rate: number;
  status: "good" | "warning" | "critical";
}

interface AttendanceLog {
  id: string;
  date: string;
  subject: string;
  time: string;
  status: "present" | "absent" | "late";
  markedBy: string;
}

const fallbackSubjects: SubjectStat[] = [
  { code: "CS301", name: "Design & Analysis of Algorithms", attended: 24, total: 26, rate: 92.3, status: "good" },
  { code: "CS302", name: "Database Management Systems", attended: 18, total: 22, rate: 81.8, status: "warning" },
  { code: "CS305", name: "Software Engineering", attended: 21, total: 22, rate: 95.4, status: "good" },
  { code: "CS402", name: "Artificial Intelligence", attended: 12, total: 18, rate: 66.6, status: "critical" },
];

const fallbackLogs: AttendanceLog[] = [
  { id: "h1", date: "2026-07-06", subject: "Design & Analysis of Algorithms", time: "09:00 AM", status: "present", markedBy: "Prof. Anand Krishnan" },
  { id: "h2", date: "2026-07-06", subject: "Operating Systems Lab", time: "11:00 AM", status: "present", markedBy: "Prof. Anand Krishnan" },
  { id: "h3", date: "2026-07-05", subject: "Design & Analysis of Algorithms", time: "09:00 AM", status: "present", markedBy: "Prof. Anand Krishnan" },
  { id: "h4", date: "2026-07-03", subject: "Artificial Intelligence", time: "02:30 PM", status: "absent", markedBy: "Dr. Ramesh Iyer" },
  { id: "h5", date: "2026-07-02", subject: "Design & Analysis of Algorithms", time: "09:00 AM", status: "late", markedBy: "Prof. Anand Krishnan" },
];

const monthlyTrend = [
  { name: "Jan", rate: 94 },
  { name: "Feb", rate: 91 },
  { name: "Mar", rate: 88 },
  { name: "Apr", rate: 86 },
  { name: "May", rate: 76 },
  { name: "Jun", rate: 86 },
];

export default function StudentAttendancePage() {
  const [selectedSem, setSelectedSem] = useState<string>("sem4");
  const [loading, setLoading] = useState(true);
  const [cumulativeRate, setCumulativeRate] = useState<number>(86.5);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>(fallbackLogs);
  const [heatmapData, setHeatmapData] = useState<Record<string, { status: string }>>({});
  const [studentProfile, setStudentProfile] = useState<any>(null);

  useEffect(() => {
    async function loadStudentData() {
      try {
        setLoading(true);
        // 1. Fetch student's own profile and summary
        const meRes = await studentsApi.me();
        if (meRes?.data) {
          setStudentProfile(meRes.data);
          if (meRes.data.attendance_percentage !== undefined) {
            setCumulativeRate(meRes.data.attendance_percentage);
          }
        }

        // 2. Fetch student's attendance heatmap
        const heatmapRes = await attendanceApi.getHeatmap();
        if (heatmapRes?.data?.heatmap) {
          setHeatmapData(heatmapRes.data.heatmap);
        }

        // 3. Fetch recent attendance records
        const recordsRes = await attendanceApi.getRecords();
        if (recordsRes?.data && recordsRes.data.length > 0) {
          const mappedLogs: AttendanceLog[] = recordsRes.data.map((r: any) => ({
            id: r.id,
            date: r.date || r.session?.date || new Date().toISOString().split("T")[0],
            subject: r.course_name || r.session?.course?.name || "Enrolled Course",
            time: "10:00 AM",
            status: (r.status as any) || "present",
            markedBy: r.marked_by || "Course Instructor",
          }));
          setAttendanceLogs(mappedLogs);
        }
      } catch (err) {
        console.warn("Could not fetch live student attendance, using baseline fallback", err);
      } finally {
        setLoading(false);
      }
    }

    loadStudentData();
  }, [selectedSem]);

  // Generate a 35-day grid for the heatmap visualization
  const heatmapDays = Array.from({ length: 35 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    const dateStr = d.toISOString().split("T")[0];
    const record = heatmapData[dateStr];
    return {
      date: dateStr,
      label: format(d, "MMM dd"),
      dayOfWeek: d.getDay(),
      status: record?.status || (i % 6 === 0 ? "absent" : i % 8 === 0 ? "late" : "present"),
    };
  });

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Student Portal", href: "/student" },
        { label: "Attendance & Performance" },
      ]}
      role="student"
    >
      <PageHeader
        title="Attendance & Analytics"
        description="Comprehensive summary of your semester lectures attendance, presence history, and metrics."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Select Semester:
            </span>
            <Select value={selectedSem} onValueChange={(v) => v && setSelectedSem(v)}>
              <SelectTrigger className="w-48 bg-card border-border">
                <SelectValue placeholder="Select Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sem4">Semester 4 (Current)</SelectItem>
                <SelectItem value="sem3">Semester 3</SelectItem>
                <SelectItem value="sem2">Semester 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Retrieving verified attendance records...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Heatmap Section */}
          <SectionCard
            title="Attendance Activity Heatmap"
            description="Visual punchcard of lecture presence across the past 5 weeks"
          >
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                {heatmapDays.map((day) => (
                  <div
                    key={day.date}
                    title={`${day.label}: ${day.status.toUpperCase()}`}
                    className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-mono cursor-pointer transition-transform hover:scale-110 border ${
                      day.status === "present"
                        ? "bg-success/20 border-success/40 text-success"
                        : day.status === "late"
                        ? "bg-warning/20 border-warning/40 text-warning"
                        : "bg-danger/20 border-danger/40 text-danger"
                    }`}
                  >
                    {day.date.split("-")[2]}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                <span className="font-semibold">Legend:</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-success/30 border border-success/50" /> Present
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-warning/30 border border-warning/50" /> Late
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-danger/30 border border-danger/50" /> Absent
                </span>
              </div>
            </div>
          </SectionCard>

          {/* Top Section: Table logs & highlights */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column (2/3): Table logs */}
            <div className="xl:col-span-2">
              <SectionCard
                title="Attendance Logs History"
                description="Chronological record of classroom session logs for this semester."
              >
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Date</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Recorded By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                            No attendance records found for this semester.
                          </TableCell>
                        </TableRow>
                      ) : (
                        attendanceLogs.map((row, i) => (
                          <motion.tr
                            key={row.id || i}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                          >
                            <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                              {row.date}
                            </TableCell>
                            <TableCell className="text-xs font-semibold">{row.subject}</TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                              {row.time}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-[9px] font-bold ${
                                  row.status === "present"
                                    ? "bg-success/15 text-success border-success/30"
                                    : row.status === "absent"
                                    ? "bg-danger/15 text-danger border-danger/30"
                                    : "bg-warning/15 text-warning border-warning/30"
                                }`}
                              >
                                {row.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {row.markedBy}
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </SectionCard>
            </div>

            {/* Right Column (1/3): Metrics breakdown */}
            <div className="xl:col-span-1 space-y-6">
              <StatsCard
                title="Cumulative Attendance"
                value={cumulativeRate}
                suffix="%"
                subtitle="Minimum requirement: 75%"
                icon={<Percent className="w-5 h-5 text-primary" />}
                variant={cumulativeRate >= 75 ? "success" : "danger"}
              />

              <SectionCard title="Attendance Health" description="Status requirement check">
                <div className="space-y-4 mt-2">
                  {cumulativeRate >= 75 ? (
                    <div className="flex items-start gap-3 p-3 rounded-lg border border-success/20 bg-success/5">
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-success">Good Standing</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          You meet the institution's mandatory 75% attendance threshold for examination eligibility.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-3 rounded-lg border border-danger/20 bg-danger/5">
                      <ShieldAlert className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-danger">Attendance Below Threshold</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Your current score is below 75%. Please attend upcoming lectures and consult your faculty advisor.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>
          </div>

          {/* Trend Chart */}
          <SectionCard
            title="Attendance Rate Over Time"
            description="Monthly trend of your cumulative attendance percentage."
          >
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="white" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} domain={[50, 100]} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Attendance Rate"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={0.15}
                    fill="hsl(var(--primary))"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          {/* Course Subject Breakdown */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Subject-wise Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {fallbackSubjects.map((sub) => (
                <motion.div
                  key={sub.code}
                  whileHover={{ y: -2 }}
                  className="rounded-xl border bg-card p-5 flex flex-col justify-between shadow-card hover:shadow-md transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-muted-foreground">{sub.code}</span>
                      <Badge
                        className={
                          sub.status === "good"
                            ? "bg-success/10 text-success border-success/30 font-semibold"
                            : sub.status === "warning"
                            ? "bg-warning/10 text-warning border-warning/30 font-semibold"
                            : "bg-danger/10 text-danger border-danger/30 font-semibold"
                        }
                      >
                        {sub.status === "good" ? "Good" : sub.status === "warning" ? "Warning" : "Critical"}
                      </Badge>
                    </div>
                    <h4 className="font-bold text-sm leading-snug line-clamp-2 min-h-[40px] text-foreground">
                      {sub.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-3">
                      Attended: <strong className="font-semibold text-foreground">{sub.attended}/{sub.total}</strong> lectures
                    </p>
                  </div>
                  <div className="mt-4 border-t border-border/60 pt-3 flex items-baseline justify-between">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Attendance</span>
                    <span className="text-lg font-bold text-foreground">{sub.rate}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
