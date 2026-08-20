"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, SectionCard } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useState } from "react";
import { FileText, Download, Calendar, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const mockClasses = [
  { id: "all", label: "All Assigned Classes" },
  { id: "CS301", label: "CS301 — Algorithms" },
  { id: "CS302", label: "CS302 — Database Systems" },
  { id: "CS305", label: "CS305 — Software Engineering" },
];

const mockStudentReportData = [
  { studentId: "s101", name: "David Miller", roll: "CS2401", present: 28, absent: 2, late: 2, percentage: 87.5 },
  { studentId: "s102", name: "Sophia Martinez", roll: "CS2402", present: 31, absent: 1, late: 0, percentage: 96.8 },
  { studentId: "s103", name: "Emma Watson", roll: "CS2403", present: 25, absent: 5, late: 2, percentage: 78.1 },
  { studentId: "s104", name: "Alex Thompson", roll: "CS2404", present: 30, absent: 0, late: 2, percentage: 93.7 },
  { studentId: "s105", name: "Michael Chen", roll: "CS2405", present: 29, absent: 1, late: 2, percentage: 90.6 },
];

const chartData = [
  { name: "CS301", Present: 94.2, Absent: 5.8 },
  { name: "CS302", Present: 88.5, Absent: 11.5 },
  { name: "CS305", Present: 91.8, Absent: 8.2 },
  { name: "CS412", Present: 96.1, Absent: 3.9 },
];

export default function TeacherReportsPage() {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: string) => {
    setIsExporting(true);
    toast.info(`Generating ${format} report...`);
    await new Promise((r) => setTimeout(r, 1500));
    setIsExporting(false);
    toast.success(`Report downloaded successfully in ${format} format!`);
  };

  const filteredStudents = mockStudentReportData.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout
      role="teacher"
      breadcrumbs={[{ label: "Dashboard", href: "/teacher" }, { label: "Reports" }]}
    >
      <PageHeader
        title="Attendance Reports"
        description="Extract compiled class registries and export student presence summaries."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("PDF")}
              disabled={isExporting}
              className="gap-1.5"
            >
              <FileText className="w-4 h-4 text-danger" /> Export PDF
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleExport("CSV")}
              disabled={isExporting}
              className="gap-1.5"
            >
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Overview Chart */}
        <div className="lg:col-span-2">
          <SectionCard title="Attendance Performance by Class" description="Average percentage metrics for active semesters.">
            <div className="h-[260px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} domain={[50, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="Present" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={36} />
                  <Bar dataKey="Absent" fill="hsl(var(--muted-foreground)/30)" radius={[4, 4, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* Filters Panel */}
        <div className="lg:col-span-1">
          <SectionCard title="Filter Settings">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="classSelect">Choose Class</Label>
                <Select
                  value={selectedClass}
                  onValueChange={(value) => setSelectedClass(value ?? "all")}
                >
                  <SelectTrigger id="classSelect">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dateRange">Date Range</Label>
                <div className="relative">
                  <Input id="dateRange" value="Last 30 Days (June 7 — July 7)" disabled className="pl-9 bg-muted/50" />
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label htmlFor="studentSearch">Student Name</Label>
                <div className="relative">
                  <Input
                    id="studentSearch"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Report Table */}
      <SectionCard title="Attendance Registries Summary" description="List of overall student records based on filter metrics.">
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Student</TableHead>
                <TableHead>Roll ID</TableHead>
                <TableHead className="text-center">Present Sessions</TableHead>
                <TableHead className="text-center">Absences</TableHead>
                <TableHead className="text-center">Late Marks</TableHead>
                <TableHead className="text-right">Attendance Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((st) => (
                  <TableRow key={st.studentId}>
                    <TableCell className="font-medium text-foreground">{st.name}</TableCell>
                    <TableCell className="font-mono text-xs">{st.roll}</TableCell>
                    <TableCell className="text-center font-medium">{st.present}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{st.absent}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{st.late}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold text-sm ${st.percentage >= 90 ? "text-primary" : st.percentage >= 80 ? "text-warning" : "text-danger"}`}>
                        {st.percentage}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No student registries match your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
