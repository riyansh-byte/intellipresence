// ============================================================
// IntelliPresence — Shared TypeScript Types
// ============================================================

// ─────────────────────────────────────────
// Enums
// ─────────────────────────────────────────

export type UserRole = "super_admin" | "org_admin" | "teacher" | "student" | "parent";

export type AttendanceStatus = "present" | "absent" | "late" | "excused" | "holiday";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export type ReportType = "daily" | "weekly" | "monthly" | "semester" | "department" | "class";

export type NotificationType = "attendance" | "system" | "workflow" | "report" | "leave" | "alert";

export type WorkflowStatus = "active" | "inactive" | "error" | "paused";

// ─────────────────────────────────────────
// Base Entity
// ─────────────────────────────────────────

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  deleted_at?: string | null;
}

// ─────────────────────────────────────────
// Organization
// ─────────────────────────────────────────

export interface Organization extends BaseEntity {
  name: string;
  slug: string;
  logo_url?: string;
  domain?: string;
  type: "school" | "college" | "university" | "corporate" | "other";
  plan: "starter" | "pro" | "enterprise";
  settings: OrganizationSettings;
  address?: string;
  city?: string;
  country?: string;
  timezone: string;
  is_active: boolean;
  subscription_expires_at?: string;
}

export interface OrganizationSettings {
  attendance_threshold: number; // minimum % to be considered good
  late_grace_minutes: number;
  working_days: number[];        // 0=Sunday, 1=Monday, ...
  academic_year_start: string;
  academic_year_end: string;
  enable_face_recognition: boolean;
  enable_qr_attendance: boolean;
  enable_notifications: boolean;
  n8n_webhook_url?: string;
  s3_bucket_override?: string;
}

// ─────────────────────────────────────────
// User & Auth
// ─────────────────────────────────────────

export interface User extends BaseEntity {
  email: string;
  full_name: string;
  display_name?: string;
  avatar_url?: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  last_sign_in_at?: string;
  email_verified: boolean;
  metadata?: Record<string, unknown>;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  organization_id: string;
  organization: Pick<Organization, "id" | "name" | "slug" | "logo_url" | "plan">;
}

// ─────────────────────────────────────────
// Department
// ─────────────────────────────────────────

export interface Department extends BaseEntity {
  name: string;
  code: string;
  description?: string;
  head_teacher_id?: string;
  head_teacher?: Pick<Teacher, "id" | "full_name" | "avatar_url">;
  student_count?: number;
  teacher_count?: number;
  is_active: boolean;
}

// ─────────────────────────────────────────
// Teacher
// ─────────────────────────────────────────

export interface Teacher extends BaseEntity {
  user_id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  department_id: string;
  department?: Pick<Department, "id" | "name" | "code">;
  designation?: string;
  subjects?: Subject[];
  is_active: boolean;
  join_date?: string;
}

// ─────────────────────────────────────────
// Student
// ─────────────────────────────────────────

export interface Student extends BaseEntity {
  user_id?: string;
  student_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  department_id: string;
  department?: Pick<Department, "id" | "name" | "code">;
  class_id?: string;
  class?: Pick<Class, "id" | "name" | "section">;
  roll_number?: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "other";
  parent_name?: string;
  parent_phone?: string;
  address?: string;
  attendance_percentage?: number;
  is_active: boolean;
  join_date?: string;
  face_profile_id?: string;  // future: AWS Rekognition
}

// ─────────────────────────────────────────
// Course / Class / Subject
// ─────────────────────────────────────────

export interface Course extends BaseEntity {
  name: string;
  code: string;
  description?: string;
  department_id: string;
  credits?: number;
  is_active: boolean;
}

export interface Class extends BaseEntity {
  name: string;
  section?: string;
  course_id: string;
  course?: Pick<Course, "id" | "name" | "code">;
  teacher_id: string;
  teacher?: Pick<Teacher, "id" | "full_name" | "avatar_url">;
  student_count?: number;
  schedule?: ClassSchedule[];
  room?: string;
  is_active: boolean;
}

export interface ClassSchedule {
  day: number; // 0-6
  start_time: string; // HH:mm
  end_time: string;
}

export interface Subject extends BaseEntity {
  name: string;
  code: string;
  course_id: string;
  teacher_id?: string;
}

// ─────────────────────────────────────────
// Attendance
// ─────────────────────────────────────────

export interface AttendanceSession extends BaseEntity {
  class_id: string;
  class?: Pick<Class, "id" | "name" | "section">;
  teacher_id: string;
  teacher?: Pick<Teacher, "id" | "full_name">;
  date: string; // ISO date
  start_time: string;
  end_time?: string;
  status: "open" | "closed" | "cancelled";
  mode: "manual" | "qr" | "face_recognition" | "auto";
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  notes?: string;
}

export interface AttendanceRecord extends BaseEntity {
  session_id: string;
  student_id: string;
  student?: Pick<Student, "id" | "student_id" | "full_name" | "avatar_url" | "roll_number">;
  status: AttendanceStatus;
  marked_at: string;
  marked_by: string; // user_id
  notes?: string;
  location?: { lat: number; lng: number };
  face_confidence?: number; // future: Rekognition score
}

export interface AttendanceSummary {
  student_id: string;
  total_classes: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
  trend: "up" | "down" | "stable";
}

// ─────────────────────────────────────────
// Leave Requests
// ─────────────────────────────────────────

export interface LeaveRequest extends BaseEntity {
  student_id: string;
  student?: Pick<Student, "id" | "full_name" | "avatar_url">;
  from_date: string;
  to_date: string;
  reason: string;
  status: LeaveStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  reviewer_notes?: string;
  attachments?: StorageFile[];
}

// ─────────────────────────────────────────
// Reports
// ─────────────────────────────────────────

export interface Report extends BaseEntity {
  title: string;
  type: ReportType;
  department_id?: string;
  class_id?: string;
  from_date: string;
  to_date: string;
  generated_by: string;
  file_url?: string;
  file_size?: number;
  storage_file_id?: string;
  status: "generating" | "ready" | "failed";
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────

export interface Notification extends BaseEntity {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────
// Audit Logs
// ─────────────────────────────────────────

export interface AuditLog extends BaseEntity {
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  action: string;
  resource_type: string;
  resource_id?: string;
  changes?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

// ─────────────────────────────────────────
// Workflow (n8n)
// ─────────────────────────────────────────

export interface WorkflowLog extends BaseEntity {
  workflow_name: string;
  trigger_event: string;
  status: "success" | "failed" | "pending";
  webhook_url: string;
  payload?: Record<string, unknown>;
  response?: Record<string, unknown>;
  duration_ms?: number;
  error_message?: string;
}

// ─────────────────────────────────────────
// Storage (AWS S3)
// ─────────────────────────────────────────

export interface StorageFile extends BaseEntity {
  name: string;
  bucket: string;
  key: string;
  size: number;
  mime_type: string;
  url?: string;          // presigned URL (ephemeral)
  uploaded_by: string;
  entity_type?: string;  // "student" | "report" | "certificate" etc.
  entity_id?: string;
}

// ─────────────────────────────────────────
// Face Profile (future — AWS Rekognition)
// ─────────────────────────────────────────

export interface FaceProfile extends BaseEntity {
  student_id: string;
  rekognition_face_id?: string;   // AWS Rekognition FaceId
  collection_id?: string;         // AWS Rekognition CollectionId
  storage_file_id?: string;       // reference image in S3
  is_enrolled: boolean;
  liveness_verified: boolean;
  last_verified_at?: string;
  confidence_threshold: number;
}

// ─────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────

export interface DashboardStats {
  today: {
    total: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  weekly_trend: TrendPoint[];
  monthly_trend: TrendPoint[];
  department_comparison: DepartmentStat[];
  recent_activities: ActivityItem[];
}

export interface TrendPoint {
  date: string;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

export interface DepartmentStat {
  department_id: string;
  department_name: string;
  percentage: number;
  total: number;
  present: number;
}

export interface ActivityItem {
  id: string;
  type: "attendance_marked" | "student_added" | "report_generated" | "leave_approved" | "session_created";
  message: string;
  actor: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────
// API Response Wrappers
// ─────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}

// ─────────────────────────────────────────
// Filter / Query Params
// ─────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  search?: string;
}

export interface AttendanceFilterParams extends PaginationParams {
  class_id?: string;
  department_id?: string;
  from_date?: string;
  to_date?: string;
  status?: AttendanceStatus;
}

export interface StudentFilterParams extends PaginationParams {
  department_id?: string;
  class_id?: string;
  is_active?: boolean;
  min_attendance?: number;
}
