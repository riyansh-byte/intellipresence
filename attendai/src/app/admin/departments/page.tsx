"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, SectionCard } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Plus, Search, GraduationCap, Users, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { departmentsApi, type Department } from "@/lib/api";

export default function DepartmentsPage() {
  const [search, setSearch] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");

  async function loadDepartments() {
    setLoading(true);
    try {
      const res = await departmentsApi.list() as any;
      setDepartments(res?.data ?? []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDepartments(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName || !newDeptCode) {
      toast.error("Please fill in department name and code");
      return;
    }
    setSubmitting(true);
    try {
      await departmentsApi.create({ name: newDeptName, code: newDeptCode.toUpperCase() });
      toast.success("Department created successfully!");
      setNewDeptName("");
      setNewDeptCode("");
      loadDepartments();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create department");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (dept: Department) => {
    try {
      await departmentsApi.update(dept.id, { is_active: !dept.is_active });
      toast.success(`Department ${dept.is_active ? "deactivated" : "activated"}`);
      loadDepartments();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update department");
    }
  };

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout
      breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Departments" }]}
    >
      <PageHeader
        title="Departments"
        description="Configure organization divisions, codes, and access permissions"
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left Form */}
        <div className="xl:col-span-1">
          <SectionCard title="Create Department">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="deptName">Department Name</Label>
                <Input
                  id="deptName"
                  placeholder="e.g. Electrical Engineering"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deptCode">Department Code</Label>
                <Input
                  id="deptCode"
                  placeholder="e.g. ECE"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  className="font-mono"
                  disabled={submitting}
                />
              </div>
              <Button type="submit" className="w-full btn-brand gap-2 text-xs font-semibold" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {submitting ? "Creating..." : "Add Department"}
              </Button>
            </form>
          </SectionCard>

          <SectionCard title="Department Insights" className="mt-4">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Departments</span>
                <span className="font-bold">{departments.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Active Divisions</span>
                <span className="font-bold text-success">
                  {departments.filter((d) => d.is_active).length}
                </span>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right Grid */}
        <div className="xl:col-span-2 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search departments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading departments...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
              <GraduationCap className="w-10 h-10 opacity-30" />
              <p className="text-sm">No departments yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((dept, i) => (
                <motion.div
                  key={dept.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={`border rounded-2xl bg-card p-5 hover:shadow-card-hover transition-all flex flex-col justify-between ${
                    !dept.is_active && "opacity-60 bg-muted/20"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="outline" className="font-mono text-xs">{dept.code}</Badge>
                      <Badge
                        variant={dept.is_active ? "default" : "secondary"}
                        className={`text-[10px] cursor-pointer ${
                          dept.is_active
                            ? "bg-success/15 text-success hover:bg-success/20 border-success/30"
                            : ""
                        }`}
                        onClick={() => handleToggleStatus(dept)}
                      >
                        {dept.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <h3 className="text-sm font-semibold tracking-tight mb-1 leading-tight">
                      {dept.name}
                    </h3>

                    <div className="flex gap-3 text-[11px] mt-1.5 text-muted-foreground font-medium">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {dept.student_count ?? 0} Students
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {dept.teacher_count ?? 0} Teachers
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t pt-3 mt-4 text-xs text-muted-foreground">
                    <Link
                      href={`/admin/teachers?department=${dept.id}`}
                      className="text-xs text-primary hover:text-primary/80 hover:underline font-semibold transition-all"
                    >
                      View Teachers →
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 ${dept.is_active ? "text-destructive hover:text-destructive" : "text-success hover:text-success"}`}
                      title={dept.is_active ? "Deactivate" : "Activate"}
                      onClick={() => handleToggleStatus(dept)}
                    >
                      {dept.is_active
                        ? <XCircle className="w-3.5 h-3.5" />
                        : <CheckCircle2 className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function Label({ className, children, ...props }: any) {
  return (
    <label className={`text-xs font-semibold text-muted-foreground ${className}`} {...props}>
      {children}
    </label>
  );
}
