// ============================================================
// IntelliPresence — Mock / Demo Data
// Realistic data for all dashboard views without a backend
// ============================================================

import type {
  DashboardStats,
  Student,
  Teacher,
  Department,
  AttendanceSession,
  AttendanceRecord,
  Notification,
  AuditLog,
  Report,
  LeaveRequest,
  TrendPoint,
  ActivityItem,
} from "@/types";

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

const ORG_ID = "org_demo_001";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function dateStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

// ─────────────────────────────────────────
// Departments
// ─────────────────────────────────────────

export const mockDepartments: Department[] = [
  { id: "dept_001", name: "Computer Science", code: "CS", organization_id: ORG_ID, is_active: true, student_count: 148, teacher_count: 12, created_at: daysAgo(365), updated_at: daysAgo(1) },
  { id: "dept_002", name: "Electronics & Communication", code: "EC", organization_id: ORG_ID, is_active: true, student_count: 112, teacher_count: 9, created_at: daysAgo(365), updated_at: daysAgo(1) },
  { id: "dept_003", name: "Mechanical Engineering", code: "ME", organization_id: ORG_ID, is_active: true, student_count: 96, teacher_count: 8, created_at: daysAgo(365), updated_at: daysAgo(1) },
  { id: "dept_004", name: "Civil Engineering", code: "CE", organization_id: ORG_ID, is_active: true, student_count: 78, teacher_count: 7, created_at: daysAgo(365), updated_at: daysAgo(2) },
  { id: "dept_005", name: "Business Administration", code: "BA", organization_id: ORG_ID, is_active: true, student_count: 134, teacher_count: 10, created_at: daysAgo(365), updated_at: daysAgo(3) },
];

// ─────────────────────────────────────────
// Teachers
// ─────────────────────────────────────────

export const mockTeachers: Teacher[] = [
  { id: "t001", user_id: "u_t001", employee_id: "EMP001", full_name: "Dr. Priya Sharma", email: "priya.sharma@IntelliPresence.edu", department_id: "dept_001", designation: "Associate Professor", is_active: true, organization_id: ORG_ID, avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Priya`, created_at: daysAgo(300), updated_at: daysAgo(1) },
  { id: "t002", user_id: "u_t002", employee_id: "EMP002", full_name: "Prof. Rahul Mehta", email: "rahul.mehta@IntelliPresence.edu", department_id: "dept_002", designation: "Professor", is_active: true, organization_id: ORG_ID, avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul`, created_at: daysAgo(290), updated_at: daysAgo(2) },
  { id: "t003", user_id: "u_t003", employee_id: "EMP003", full_name: "Ms. Ananya Patel", email: "ananya.patel@IntelliPresence.edu", department_id: "dept_003", designation: "Assistant Professor", is_active: true, organization_id: ORG_ID, avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya`, created_at: daysAgo(280), updated_at: daysAgo(1) },
  { id: "t004", user_id: "u_t004", employee_id: "EMP004", full_name: "Mr. Vikram Singh", email: "vikram.singh@IntelliPresence.edu", department_id: "dept_001", designation: "Assistant Professor", is_active: true, organization_id: ORG_ID, avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram`, created_at: daysAgo(250), updated_at: daysAgo(3) },
  { id: "t005", user_id: "u_t005", employee_id: "EMP005", full_name: "Dr. Sunita Rao", email: "sunita.rao@IntelliPresence.edu", department_id: "dept_005", designation: "Professor", is_active: true, organization_id: ORG_ID, avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Sunita`, created_at: daysAgo(220), updated_at: daysAgo(1) },
  { id: "t006", user_id: "u_t006", employee_id: "EMP006", full_name: "Mr. Arjun Kumar", email: "arjun.kumar@IntelliPresence.edu", department_id: "dept_004", designation: "Lecturer", is_active: false, organization_id: ORG_ID, avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun`, created_at: daysAgo(200), updated_at: daysAgo(30) },
];

// ─────────────────────────────────────────
// Students
// ─────────────────────────────────────────

const studentNames = [
  "Aditya Verma", "Sneha Gupta", "Rohan Joshi", "Kavya Reddy", "Aryan Mishra",
  "Pooja Nair", "Kartik Shah", "Divya Pillai", "Nikhil Pandey", "Swati Iyer",
  "Harsh Agarwal", "Meera Krishnan", "Siddharth Roy", "Priyanka Das", "Yash Malhotra",
  "Asha Murthy", "Devraj Kapoor", "Riya Bose", "Tanvir Ali", "Lakshmi Venkat",
];

export const mockStudents: Student[] = studentNames.map((name, i) => ({
  id: `s${String(i + 1).padStart(3, "0")}`,
  student_id: `STU${String(2024001 + i)}`,
  full_name: name,
  email: `${name.toLowerCase().replace(/\s+/g, ".")}@student.IntelliPresence.edu`,
  department_id: mockDepartments[i % mockDepartments.length].id,
  department: mockDepartments[i % mockDepartments.length],
  roll_number: `${mockDepartments[i % mockDepartments.length].code}${String(i + 1).padStart(3, "0")}`,
  gender: i % 3 === 0 ? "female" : "male",
  attendance_percentage: Math.floor(Math.random() * 35) + 65,
  is_active: i !== 18,
  organization_id: ORG_ID,
  avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
  created_at: daysAgo(200 - i * 5),
  updated_at: daysAgo(i % 7),
}));

// ─────────────────────────────────────────
// Attendance Trend (30 days)
// ─────────────────────────────────────────

export const mockWeeklyTrend: TrendPoint[] = Array.from({ length: 30 }, (_, i) => {
  const present = Math.floor(Math.random() * 20) + 140;
  const absent = Math.floor(Math.random() * 20) + 20;
  const late = Math.floor(Math.random() * 10) + 5;
  const total = present + absent + late;
  return {
    date: dateStr(29 - i),
    present,
    absent,
    late,
    percentage: Math.round((present / total) * 100),
  };
});

// ─────────────────────────────────────────
// Dashboard Stats
// ─────────────────────────────────────────

export const mockDashboardStats: DashboardStats = {
  today: {
    total: 568,
    present: 472,
    absent: 61,
    late: 35,
    percentage: 83,
  },
  weekly_trend: mockWeeklyTrend,
  monthly_trend: mockWeeklyTrend,
  department_comparison: [
    { department_id: "dept_001", department_name: "Computer Science", percentage: 88, total: 148, present: 130 },
    { department_id: "dept_002", department_name: "Electronics", percentage: 82, total: 112, present: 92 },
    { department_id: "dept_003", department_name: "Mechanical", percentage: 79, total: 96, present: 76 },
    { department_id: "dept_004", department_name: "Civil", percentage: 85, total: 78, present: 66 },
    { department_id: "dept_005", department_name: "Business Admin", percentage: 91, total: 134, present: 122 },
  ],
  recent_activities: [
    { id: "act1", type: "attendance_marked", message: "Attendance marked for CS301 — 42 students", actor: "Dr. Priya Sharma", timestamp: daysAgo(0), metadata: { class: "CS301" } },
    { id: "act2", type: "student_added", message: "New student Tanvir Ali added to CS dept", actor: "Admin", timestamp: daysAgo(0), metadata: {} },
    { id: "act3", type: "report_generated", message: "Weekly report generated for all departments", actor: "System", timestamp: daysAgo(1), metadata: {} },
    { id: "act4", type: "leave_approved", message: "Leave request approved for Sneha Gupta", actor: "Prof. Rahul Mehta", timestamp: daysAgo(1), metadata: {} },
    { id: "act5", type: "session_created", message: "New attendance session started for EC201", actor: "Prof. Rahul Mehta", timestamp: daysAgo(1), metadata: {} },
    { id: "act6", type: "attendance_marked", message: "Attendance marked for ME101 — 35 students", actor: "Ms. Ananya Patel", timestamp: daysAgo(2), metadata: { class: "ME101" } },
  ],
};

// ─────────────────────────────────────────
// Attendance Sessions
// ─────────────────────────────────────────

export const mockSessions: AttendanceSession[] = [
  { id: "sess001", class_id: "cls001", teacher_id: "t001", date: dateStr(0), start_time: "09:00", end_time: "10:00", status: "closed", mode: "manual", total_students: 42, present_count: 38, absent_count: 3, late_count: 1, organization_id: ORG_ID, created_at: daysAgo(0), updated_at: daysAgo(0) },
  { id: "sess002", class_id: "cls002", teacher_id: "t002", date: dateStr(0), start_time: "10:30", status: "open", mode: "manual", total_students: 38, present_count: 30, absent_count: 5, late_count: 3, organization_id: ORG_ID, created_at: daysAgo(0), updated_at: daysAgo(0) },
  { id: "sess003", class_id: "cls001", teacher_id: "t001", date: dateStr(1), start_time: "09:00", end_time: "10:00", status: "closed", mode: "manual", total_students: 42, present_count: 35, absent_count: 5, late_count: 2, organization_id: ORG_ID, created_at: daysAgo(1), updated_at: daysAgo(1) },
];

// ─────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────

export const mockNotifications: Notification[] = [
  { id: "n001", user_id: "u001", type: "attendance", title: "Low Attendance Alert", message: "3 students have attendance below 75% this month", is_read: false, organization_id: ORG_ID, created_at: daysAgo(0), updated_at: daysAgo(0) },
  { id: "n002", user_id: "u001", type: "report", title: "Weekly Report Ready", message: "The weekly attendance report has been generated and is ready to download", is_read: false, action_url: "/admin/reports", organization_id: ORG_ID, created_at: daysAgo(1), updated_at: daysAgo(1) },
  { id: "n003", user_id: "u001", type: "leave", title: "Leave Request", message: "Rohan Joshi submitted a leave request for 3 days", is_read: true, action_url: "/admin/leave", organization_id: ORG_ID, created_at: daysAgo(1), updated_at: daysAgo(1) },
  { id: "n004", user_id: "u001", type: "system", title: "Backup Complete", message: "Daily data backup completed successfully", is_read: true, organization_id: ORG_ID, created_at: daysAgo(2), updated_at: daysAgo(2) },
  { id: "n005", user_id: "u001", type: "workflow", title: "n8n Workflow Triggered", message: "Attendance workflow ran successfully for today's sessions", is_read: true, organization_id: ORG_ID, created_at: daysAgo(2), updated_at: daysAgo(2) },
];

// ─────────────────────────────────────────
// Audit Logs
// ─────────────────────────────────────────

export const mockAuditLogs: AuditLog[] = [
  { id: "al001", actor_id: "u001", actor_name: "Admin User", actor_role: "org_admin", action: "CREATE", resource_type: "student", resource_id: "s020", ip_address: "192.168.1.100", organization_id: ORG_ID, created_at: daysAgo(0), updated_at: daysAgo(0) },
  { id: "al002", actor_id: "u_t001", actor_name: "Dr. Priya Sharma", actor_role: "teacher", action: "MARK_ATTENDANCE", resource_type: "attendance_session", resource_id: "sess001", ip_address: "192.168.1.101", organization_id: ORG_ID, created_at: daysAgo(0), updated_at: daysAgo(0) },
  { id: "al003", actor_id: "u001", actor_name: "Admin User", actor_role: "org_admin", action: "UPDATE", resource_type: "department", resource_id: "dept_001", ip_address: "192.168.1.100", organization_id: ORG_ID, created_at: daysAgo(1), updated_at: daysAgo(1) },
  { id: "al004", actor_id: "u_t002", actor_name: "Prof. Rahul Mehta", actor_role: "teacher", action: "APPROVE_LEAVE", resource_type: "leave_request", resource_id: "lr001", ip_address: "192.168.1.102", organization_id: ORG_ID, created_at: daysAgo(1), updated_at: daysAgo(1) },
  { id: "al005", actor_id: "u001", actor_name: "Admin User", actor_role: "org_admin", action: "GENERATE_REPORT", resource_type: "report", resource_id: "rep001", ip_address: "192.168.1.100", organization_id: ORG_ID, created_at: daysAgo(2), updated_at: daysAgo(2) },
];

// ─────────────────────────────────────────
// Reports
// ─────────────────────────────────────────

export const mockReports: Report[] = [
  { id: "rep001", title: "Weekly Attendance Report - All Departments", type: "weekly", from_date: dateStr(7), to_date: dateStr(0), generated_by: "u001", status: "ready", file_size: 248000, organization_id: ORG_ID, created_at: daysAgo(0), updated_at: daysAgo(0) },
  { id: "rep002", title: "Monthly Report - Computer Science", type: "monthly", department_id: "dept_001", from_date: dateStr(30), to_date: dateStr(0), generated_by: "u001", status: "ready", file_size: 512000, organization_id: ORG_ID, created_at: daysAgo(1), updated_at: daysAgo(1) },
  { id: "rep003", title: "Daily Report - 2024-12-05", type: "daily", from_date: dateStr(2), to_date: dateStr(2), generated_by: "u001", status: "ready", file_size: 128000, organization_id: ORG_ID, created_at: daysAgo(2), updated_at: daysAgo(2) },
  { id: "rep004", title: "Semester Report - All Classes", type: "semester", from_date: dateStr(120), to_date: dateStr(0), generated_by: "u001", status: "generating", organization_id: ORG_ID, created_at: daysAgo(0), updated_at: daysAgo(0) },
];

// ─────────────────────────────────────────
// Leave Requests
// ─────────────────────────────────────────

export const mockLeaveRequests: LeaveRequest[] = [
  { id: "lr001", student_id: "s001", from_date: dateStr(2), to_date: dateStr(0), reason: "Medical emergency — fever and prescribed rest", status: "approved", reviewed_by: "u_t001", reviewed_at: daysAgo(2), organization_id: ORG_ID, created_at: daysAgo(3), updated_at: daysAgo(2) },
  { id: "lr002", student_id: "s003", from_date: dateStr(0), to_date: dateStr(-2), reason: "Family function out of town", status: "pending", organization_id: ORG_ID, created_at: daysAgo(0), updated_at: daysAgo(0) },
  { id: "lr003", student_id: "s007", from_date: dateStr(5), to_date: dateStr(3), reason: "Participating in inter-college competition", status: "approved", reviewed_by: "u_t002", reviewed_at: daysAgo(6), organization_id: ORG_ID, created_at: daysAgo(7), updated_at: daysAgo(6) },
  { id: "lr004", student_id: "s012", from_date: dateStr(1), to_date: dateStr(0), reason: "Personal reasons", status: "rejected", reviewed_by: "u_t001", reviewer_notes: "Insufficient justification provided", reviewed_at: daysAgo(1), organization_id: ORG_ID, created_at: daysAgo(2), updated_at: daysAgo(1) },
];
