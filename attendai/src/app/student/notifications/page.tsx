"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, SectionCard } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Bell, CheckCheck, Info, ShieldAlert, Calendar, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNotificationStore } from "@/store";
import { motion, AnimatePresence } from "framer-motion";

const initialNotifications = [
  {
    id: "n1",
    title: "Leave Request Approved",
    description: "Your medical leave request for July 12th has been approved by Prof. Robert.",
    type: "leave",
    date: "Today, 10:24 AM",
    read: false,
    icon: Calendar,
    color: "text-success bg-success/10 border-success/20",
  },
  {
    id: "n2",
    title: "Attendance Warning Alert",
    description: "Your attendance in Artificial Intelligence (CS402) has fallen to 66.6%. Minimum required is 75%.",
    type: "alert",
    date: "Yesterday, 04:15 PM",
    read: false,
    icon: ShieldAlert,
    color: "text-danger bg-danger/10 border-danger/20",
  },
  {
    id: "n3",
    title: "Monthly Digest Ready",
    description: "Your June attendance performance report card has been generated and is ready for review.",
    type: "report",
    date: "July 2, 2026",
    read: true,
    icon: FileText,
    color: "text-primary bg-primary/10 border-primary/20",
  },
  {
    id: "n4",
    title: "System Maintenance Notice",
    description: "The IntelliPresence portal will undergo planned maintenance on Sunday, July 12 from 02:00 AM to 04:00 AM.",
    type: "system",
    date: "June 29, 2026",
    read: true,
    icon: Info,
    color: "text-muted-foreground bg-muted border-border",
  },
];

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState("all");
  const { setUnreadCount } = useNotificationStore();

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    toast.success("All notifications marked as read");
  };

  const handleMarkOneRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    const unread = notifications.filter((n) => n.id !== id && !n.read).length;
    setUnreadCount(unread);
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notification dismissed");
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "leaves") return n.type === "leave";
    if (filter === "alerts") return n.type === "alert";
    return true;
  });

  return (
    <DashboardLayout
      role="student"
      breadcrumbs={[{ label: "Dashboard", href: "/student" }, { label: "Notifications" }]}
    >
      <PageHeader
        title="Notifications"
        description="Stay updated with approvals, system alerts, and compliance check reminders."
        actions={
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-1.5">
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </Button>
        }
      />

      <div className="max-w-4xl space-y-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-border pb-px overflow-x-auto no-scrollbar">
          {["all", "unread", "leaves", "alerts"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`text-sm px-4 py-2 border-b-2 font-medium capitalize whitespace-nowrap transition-all ${
                filter === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "leaves" ? "Leave Approvals" : tab === "alerts" ? "Important Warnings" : tab}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <SectionCard>
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {filtered.length > 0 ? (
                filtered.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`flex items-start justify-between p-4 rounded-xl border transition-all ${
                        item.read ? "bg-card border-border/60" : "bg-primary/5 border-primary/20 shadow-sm"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${item.color}`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-bold ${item.read ? "text-foreground" : "text-primary"}`}>
                              {item.title}
                            </h4>
                            {!item.read && (
                              <Badge className="bg-primary hover:bg-primary text-white text-[9px] font-bold px-1.5 py-px">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                            {item.description}
                          </p>
                          <span className="text-[10px] text-muted-foreground block pt-1">
                            {item.date}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-4">
                        {!item.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/5"
                            onClick={() => handleMarkOneRead(item.id)}
                            title="Mark as read"
                          >
                            <CheckCheck className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-danger hover:bg-danger/5"
                          onClick={() => handleDelete(item.id)}
                          title="Dismiss"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">All caught up! No notifications to display.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
