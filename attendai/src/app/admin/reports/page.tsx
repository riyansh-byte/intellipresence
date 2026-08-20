"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, SectionCard } from "@/components/ui/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  FileText, Download, Play, Calendar, CheckCircle2,
  AlertTriangle, Loader2, Sparkles, ServerCrash, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface HistoricalReport {
  id: string;
  name: string;
  type: string;
  format: "PDF" | "CSV";
  generatedAt: string;
  size: string;
  status: "ready" | "failed" | "processing";
  url?: string;
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState("monthly");
  const [format, setFormat] = useState("PDF");
  const [dept, setDept] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);

  const [history, setHistory] = useState<HistoricalReport[]>([
    { id: "rep_01", name: "CS301_Algorithms_June_Attendance", type: "Monthly Summary", format: "PDF", generatedAt: "2026-06-30 18:24", size: "1.4 MB", status: "ready", url: "#" },
    { id: "rep_02", name: "ECE201_Signals_Daily_July05", type: "Daily Detailed", format: "CSV", generatedAt: "2026-07-05 09:12", size: "244 KB", status: "ready", url: "#" },
    { id: "rep_03", name: "Campus_Wide_Attendance_Semester1", type: "Semester Analysis", format: "PDF", generatedAt: "2026-05-15 16:40", size: "4.8 MB", status: "ready", url: "#" },
    { id: "rep_04", name: "Mechanical_Engineering_Weekly_Report", type: "Weekly Summary", format: "PDF", generatedAt: "2026-07-06 14:00", size: "890 KB", status: "processing" },
  ]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    // Simulate compilation and upload to AWS S3
    await new Promise((resolve) => setTimeout(resolve, 2500));
    setIsGenerating(false);

    const newReport: HistoricalReport = {
      id: `rep_${Date.now()}`,
      name: `${dept.toUpperCase()}_Attendance_${reportType}_${new Date().toISOString().split("T")[0]}`,
      type: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Summary`,
      format: format as "PDF" | "CSV",
      generatedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      size: format === "PDF" ? "1.2 MB" : "185 KB",
      status: "ready",
      url: "#",
    };

    setHistory([newReport, ...history]);
    toast.success("Report generated and saved to S3 bucket!", {
      description: `${newReport.name}.${format.toLowerCase()} is ready.`,
    });
  };

  return (
    <DashboardLayout
      breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Reports" }]}
    >
      <PageHeader
        title="Reports Center"
        description="Compile comprehensive attendance summaries, export directories, and sync with S3 cloud storage"
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Form: Config Generation */}
        <div className="xl:col-span-1 space-y-4">
          <SectionCard title="Generate Report">
            <form onSubmit={handleGenerate} className="space-y-4">
              
              <div className="space-y-1.5">
                <Label className="text-xs">Report Type</Label>
                <Select value={reportType} onValueChange={(v) => v && setReportType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily Attendance</SelectItem>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                    <SelectItem value="monthly">Monthly Summary</SelectItem>
                    <SelectItem value="semester">Semester Comprehensive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Department Filter</Label>
                <Select value={dept} onValueChange={(v) => v && setDept(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="cse">Computer Science (CSE)</SelectItem>
                    <SelectItem value="ece">Electronics (ECE)</SelectItem>
                    <SelectItem value="mba">Business Admin (MBA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Start Date</Label>
                  <input
                    type="date"
                    defaultValue="2026-06-01"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">End Date</Label>
                  <input
                    type="date"
                    defaultValue="2026-07-06"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Export Format</Label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                  {["PDF", "CSV"].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormat(fmt)}
                      className={`py-1.5 rounded-md text-xs font-semibold transition-all ${
                        format === fmt
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isGenerating}
                className="w-full btn-brand gap-2 text-xs font-semibold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Compiling & Uploading...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Run Report Job
                  </>
                )}
              </Button>
            </form>
          </SectionCard>

          {/* S3 configuration checker */}
          <SectionCard>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <h4 className="font-semibold">AWS S3 Synced</h4>
                <p className="text-muted-foreground mt-0.5 leading-snug">
                  Reports compile in backend nodes and push directly into bucket <code className="bg-muted px-1 py-0.5 rounded">IntelliPresence-reports</code>.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right: History List */}
        <div className="xl:col-span-2">
          <SectionCard title="Generated Reports History" description="Download or verify compiled files stored in S3">
            <div className="space-y-3">
              {history.map((rep, i) => (
                <motion.div
                  key={rep.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3.5 border rounded-xl bg-card hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate leading-normal">{rep.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {rep.type} · {rep.size} · {rep.generatedAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono font-semibold">
                      {rep.format}
                    </Badge>
                    {rep.status === "ready" ? (
                      <a
                        href={rep.url}
                        download
                        className={cn(
                          buttonVariants({ size: "icon", variant: "ghost" }),
                          "h-8 w-8 text-success hover:bg-success/10"
                        )}
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    ) : rep.status === "processing" ? (
                      <div className="h-8 px-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Compiling</span>
                      </div>
                    ) : (
                      <Badge variant="destructive" className="text-[10px]">Failed</Badge>
                    )}
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
