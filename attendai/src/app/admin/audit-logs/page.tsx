"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Search, Eye, Filter, Download, Terminal } from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  actor: string;
  action: string;
  resource: string;
  type: "CREATE" | "UPDATE" | "DELETE" | "AUTH" | "EXPORT";
  ipAddress: string;
  timestamp: string;
}

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [logs] = useState<AuditLog[]>([
    { id: "log_1", actor: "Alex Mercer (Admin)", action: "Marked attendance for CS301", resource: "CS301_2026-07-06", type: "UPDATE", ipAddress: "192.168.1.104", timestamp: "2026-07-06T18:24:00Z" },
    { id: "log_2", actor: "Alex Mercer (Admin)", action: "Added new student Rahul Sharma", resource: "Student: Rahul Sharma", type: "CREATE", ipAddress: "192.168.1.104", timestamp: "2026-07-06T14:12:00Z" },
    { id: "log_3", actor: "Prof. Anand Krishnan (Teacher)", action: "Signed in to web portal", resource: "Auth Portal", type: "AUTH", ipAddress: "103.24.110.15", timestamp: "2026-07-06T09:05:00Z" },
    { id: "log_4", actor: "Alex Mercer (Admin)", action: "Exported semester reports to CSV", resource: "Report Job #2948", type: "EXPORT", ipAddress: "192.168.1.104", timestamp: "2026-07-05T16:30:00Z" },
    { id: "log_5", actor: "Dr. Ramesh Iyer (Teacher)", action: "Submitted leave request approval", resource: "Leave Req: #8491", type: "UPDATE", ipAddress: "152.12.8.94", timestamp: "2026-07-05T11:45:00Z" },
    { id: "log_6", actor: "Alex Mercer (Admin)", action: "Deleted organization department EEE", resource: "Dept Code: EEE", type: "DELETE", ipAddress: "192.168.1.104", timestamp: "2026-07-04T15:20:00Z" },
  ]);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        !search ||
        log.actor.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.resource.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || log.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [search, typeFilter]);

  return (
    <DashboardLayout
      breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Audit Logs" }]}
    >
      <PageHeader
        title="Audit Logs"
        description="Immutable tracker of administrative operations, authentication events, and organization data mutations"
        actions={
          <Button size="sm" variant="outline" className="gap-1.5">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        }
      />

      {/* Filter Row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-3 mb-5"
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search logs by actor, action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Action Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="CREATE">Create</SelectItem>
            <SelectItem value="UPDATE">Update</SelectItem>
            <SelectItem value="DELETE">Delete</SelectItem>
            <SelectItem value="AUTH">Auth Event</SelectItem>
            <SelectItem value="EXPORT">Export</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Logs Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border bg-card rounded-2xl shadow-card overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target Resource</TableHead>
              <TableHead>Action Type</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Terminal className="w-8 h-8 opacity-40" />
                    <p className="text-sm">No matching log records found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((log, i) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                  </TableCell>
                  <TableCell className="text-xs font-semibold">
                    {log.actor}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.action}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-medium">
                    {log.resource}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-bold ${
                        log.type === "CREATE"
                          ? "bg-success/10 text-success border-success/30"
                          : log.type === "DELETE"
                          ? "bg-danger/10 text-danger border-danger/30"
                          : log.type === "AUTH"
                          ? "bg-info/10 text-info border-info/30"
                          : log.type === "EXPORT"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          : "bg-warning/10 text-warning border-warning/30"
                      }`}
                    >
                      {log.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {log.ipAddress}
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>

        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
          <span>Showing {filtered.length} logs</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
