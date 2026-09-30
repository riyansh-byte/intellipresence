import { supabase } from "./supabase/client";

let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
if (API_BASE_URL && !API_BASE_URL.endsWith("/api")) {
  API_BASE_URL = `${API_BASE_URL}/api`;
}

/**
 * Helper function to get auth headers with Supabase token
 */
async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Generic API client function
 */
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  });
  
  let result: unknown;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    result = await response.json();
  } else {
    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || `API request failed with status ${response.status}`);
    }
    result = { message: text };
  }
  
  if (!response.ok) {
    const message =
      typeof result === "object" &&
      result !== null &&
      "message" in result &&
      typeof result.message === "string"
        ? result.message
        : "API request failed";
    throw new Error(message);
  }
  
  return result as T;
}

// ==============================
// INVITATIONS API
// ==============================

export interface InviteTeacherRequest {
  email: string;
  full_name: string;
  teacher_id: string;
  department_id: string;
  designation?: string;
}

export interface InviteStudentRequest {
  email: string;
  full_name: string;
  student_id: string;
  roll_number: string;
  department_id?: string;
}

export interface InvitationResponse {
  status: string;
  message: string;
  data?: {
    invitation_id: string;
    invite_link?: string;
    email_sent?: boolean;
    email: string;
    expires_at: string;
  };
}

export interface CheckInvitationResponse {
  status: string;
  message: string;
  data: {
    has_invitation: boolean;
    role?: "teacher" | "student";
    full_name?: string;
  };
}

export interface AcceptInvitationResponse {
  status: string;
  message: string;
  data: {
    role: "teacher" | "student";
    organization_id: string;
  };
}

export const invitationsApi = {
  list: (role?: "teacher" | "student") => 
    apiRequest(`/invitations${role ? `?role=${role}` : ""}`),
  
  inviteTeacher: (data: InviteTeacherRequest) => 
    apiRequest<InvitationResponse>("/invitations/teacher", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  
  inviteStudent: (data: InviteStudentRequest) => 
    apiRequest<InvitationResponse>("/invitations/student", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  
  resend: (invitationId: string) => 
    apiRequest(`/invitations/${invitationId}/resend`, {
      method: "POST"
    }),
  
  cancel: (invitationId: string) => 
    apiRequest(`/invitations/${invitationId}/cancel`, {
      method: "POST"
    }),
  
  check: (email: string) => 
    apiRequest<CheckInvitationResponse>(`/invitations/check?email=${encodeURIComponent(email)}`),
  
  accept: () => 
    apiRequest<AcceptInvitationResponse>("/invitations/accept", {
      method: "POST",
      body: JSON.stringify({})
    })
};

export interface CompleteSetupRequest {
  organization_name: string;
  departments: Array<{ name: string; code: string }>;
}

export interface CompleteSetupResponse {
  status: string;
  message: string;
  data: {
    profile: {
      id: string;
      email: string;
      full_name: string;
      role: "org_admin" | "teacher" | "student";
      organization_id: string;
      avatar_url?: string;
    };
    organization: {
      id: string;
      name: string;
      domain: string;
      logo_url?: string;
    };
    departments: Array<{ id: string; name: string; code: string }>;
  };
}

export interface UserProfileResponse {
  status: string;
  message: string;
  data: {
    profile: {
      id: string;
      email: string;
      full_name: string;
      role: "org_admin" | "teacher" | "student";
      organization_id: string;
      avatar_url?: string;
    };
    organization: {
      id: string;
      name: string;
      domain: string;
    };
    context: {
      user_id: string;
      organization_id: string;
      role: string;
    };
  };
}

export const authApi = {
  completeSetup: (data: CompleteSetupRequest) => 
    apiRequest<CompleteSetupResponse>("/auth/complete-setup", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  
  me: () => 
    apiRequest<UserProfileResponse>("/auth/me")
};

// ==============================
// STUDENTS API
// ==============================

export interface CreateStudentRequest {
  full_name: string;
  student_id: string;
  email: string;
  roll_number: string;
  department_id?: string;
}

export const studentsApi = {
  list: (departmentId?: string, search?: string) => {
    const params = new URLSearchParams();
    if (departmentId) params.set("department_id", departmentId);
    if (search) params.set("search", search);
    return apiRequest<{ data: any[] }>(`/students${params.toString() ? `?${params}` : ""}`);
  },

  me: () => apiRequest<{ data: { id: string; full_name: string; email: string; student_id: string; roll_number: string; department?: { name?: string; code?: string }; attendance_percentage?: number; attendance_summary?: { total_sessions: number; present_count: number; absent_count: number; late_count: number; excused_count: number; attendance_percentage: number } } }>("/students/me"),
  
  get: (id: string) => apiRequest<{ data: any }>(`/students/${id}`),
  
  create: (data: CreateStudentRequest) => 
    apiRequest("/students", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  
  update: (id: string, data: Partial<CreateStudentRequest>) => 
    apiRequest(`/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    }),
  
  deactivate: (id: string) => 
    apiRequest(`/students/${id}`, {
      method: "DELETE"
    })
};

// ==============================
// TEACHERS API
// ==============================

export interface CreateTeacherRequest {
  full_name: string;
  teacher_id: string;
  email: string;
  department_id?: string;
  designation?: string;
}

export const teachersApi = {
  list: (departmentId?: string, search?: string) => {
    const params = new URLSearchParams();
    if (departmentId) params.set("department_id", departmentId);
    if (search) params.set("search", search);
    return apiRequest<{ data: any[] }>(`/teachers${params.toString() ? `?${params}` : ""}`);
  },
  
  get: (id: string) => apiRequest(`/teachers/${id}`),
  
  create: (data: CreateTeacherRequest) => 
    apiRequest("/teachers", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  
  update: (id: string, data: Partial<CreateTeacherRequest>) => 
    apiRequest(`/teachers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    }),
  
  deactivate: (id: string) => 
    apiRequest(`/teachers/${id}`, {
      method: "DELETE"
    })
};

// ==============================
// DEPARTMENTS API
// ==============================

export interface Department {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  student_count?: number;
  teacher_count?: number;
}

export const departmentsApi = {
  list: () => apiRequest<{ data: Department[] }>("/departments/"),

  create: (data: { name: string; code: string }) =>
    apiRequest<{ data: Department }>("/departments/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<{ name: string; code: string; is_active: boolean }>) =>
    apiRequest<{ data: Department }>(`/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deactivate: (id: string) =>
    apiRequest(`/departments/${id}`, { method: "DELETE" }),
};

// ==============================
// COURSES API
// ==============================

export interface Course {
  id: string;
  name: string;
  code: string;
  department_id?: string;
  department?: { id?: string; name: string; code: string };
  semester?: number;
  credits?: number;
  is_active?: boolean;
}

export const coursesApi = {
  list: (departmentId?: string) => {
    const params = new URLSearchParams();
    if (departmentId && departmentId !== "all") params.set("department_id", departmentId);
    return apiRequest<{ data: Course[] }>(`/courses/${params.toString() ? `?${params}` : ""}`);
  },

  get: (id: string) => apiRequest<{ data: Course }>(`/courses/${id}`),

  create: (data: { name: string; code: string; department_id: string; credits?: number; semester?: number }) =>
    apiRequest<{ data: Course }>("/courses/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Course>) =>
    apiRequest<{ data: Course }>(`/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) => apiRequest(`/courses/${id}`, { method: "DELETE" }),
};

// ==============================
// ATTENDANCE API
// ==============================

export const attendanceApi = {
  /** Create a new roll-call session for a course+date */
  createSession: (courseId: string, date: string) =>
    apiRequest<{ data: { id: string; course_id: string; date: string; teacher_id: string | null } }>(
      "/attendance/session",
      { method: "POST", body: JSON.stringify({ course_id: courseId, date }) }
    ),

  /** List sessions — teacher sees their own, admin sees all */
  listSessions: (courseId?: string, dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    if (courseId) params.set("course_id", courseId);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    return apiRequest<{ data: any[] }>(`/attendance/sessions${params.toString() ? `?${params}` : ""}`);
  },

  /** Upsert attendance records for a session */
  saveRecords: (sessionId: string, records: Array<{ student_id: string; status: string }>) =>
    apiRequest<{ data: { saved_count: number; errors: string[] } }>(
      "/attendance/records",
      { method: "POST", body: JSON.stringify({ session_id: sessionId, records }) }
    ),

  /** Fetch records for a session or student */
  getRecords: (sessionId?: string, studentId?: string) => {
    const params = new URLSearchParams();
    if (sessionId) params.set("session_id", sessionId);
    if (studentId) params.set("student_id", studentId);
    return apiRequest<{ data: any[] }>(`/attendance/records${params.toString() ? `?${params}` : ""}`);
  },

  /** Per-student attendance heatmap */
  getHeatmap: (studentId?: string) => {
    const params = studentId ? `?student_id=${studentId}` : "";
    return apiRequest<{
      data: {
        student_id: string;
        full_name: string;
        heatmap: Record<string, { status: string; session_id: string; course_id: string | null }>;
      };
    }>(`/attendance/heatmap${params}`);
  },
};

// ==============================
// LEAVE REQUESTS API
// ==============================

export interface LeaveRequest {
  id: string;
  student_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  created_at: string;
  student?: {
    full_name: string;
    roll_number: string;
    email: string;
  };
}

export const leavesApi = {
  /** Student: submit a new leave request */
  submit: (data: { start_date: string; end_date: string; reason: string }) =>
    apiRequest<{ data: LeaveRequest }>("/leaves/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** List leave requests — students see own, admin/teacher see all */
  list: (filters?: { status?: string; student_id?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.student_id) params.set("student_id", filters.student_id);
    return apiRequest<{ data: LeaveRequest[] }>(`/leaves/${params.toString() ? `?${params}` : ""}`);
  },

  /** Get a single leave request by ID */
  get: (id: string) => apiRequest<{ data: LeaveRequest }>(`/leaves/${id}`),

  /** Teacher/Admin: approve a pending leave */
  approve: (id: string) =>
    apiRequest<{ data: LeaveRequest }>(`/leaves/${id}/approve`, { method: "PUT" }),

  /** Teacher/Admin: reject a pending leave */
  reject: (id: string) =>
    apiRequest<{ data: LeaveRequest }>(`/leaves/${id}/reject`, { method: "PUT" }),

  /** Student: cancel their own pending leave */
  cancel: (id: string) =>
    apiRequest(`/leaves/${id}`, { method: "DELETE" }),
};

// ==============================
// TEACHER SELF-SERVICE API
// ==============================

export const teacherApi = {
  /** Authenticated teacher's own profile */
  me: () => apiRequest<{ data: ReturnType<typeof Object> }>("/teachers/me"),

  /** Courses in the teacher's department with live attendance stats */
  myCourses: () =>
    apiRequest<{
      data: Array<{
        id: string;
        name: string;
        code: string;
        department_id: string;
        department?: { name: string; code: string };
        sessions_run: number;
        avg_attendance_pct: number;
      }>;
    }>("/teachers/me/courses"),
};

// ==============================
// ANALYTICS API
// ==============================

export const analyticsApi = {
  overview: () =>
    apiRequest<{
      data: {
        today: { present: number; absent: number; late: number; total: number; percentage: number };
        averages: { overall: number; monthly: number; semester: number };
        totals: { active_students: number; sessions_run: number };
      };
    }>("/analytics/overview"),

  departmentTrends: () =>
    apiRequest<{
      data: Array<{
        department_id: string;
        department_name: string;
        percentage: number;
        total_records: number;
      }>;
    }>("/analytics/department-trends"),

  lowAttendance: (threshold?: number) =>
    apiRequest<{
      data: Array<{
        student_id: string;
        full_name: string;
        roll_number: string;
        email: string;
        attendance_percentage: number;
        total_sessions: number;
        present_count: number;
      }>;
    }>(`/analytics/low-attendance${threshold ? `?threshold=${threshold}` : ""}`),
};

// ==============================
// REPORTS API
// ==============================

export const reportsApi = {
  generate: (type: "monthly" | "semester" | "custom" | "department", format: "PDF" | "CSV", dateFrom?: string, dateTo?: string) =>
    apiRequest<{
      data: {
        id: string;
        name: string;
        type: string;
        format: string;
        status: string;
        aws_s3_url: string | null;
        created_at: string;
      };
    }>("/reports/generate", {
      method: "POST",
      body: JSON.stringify({ type, format, date_from: dateFrom, date_to: dateTo }),
    }),

  summary: (dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    return apiRequest<{
      data: {
        total_records: number;
        present: number;
        absent: number;
        late: number;
        excused: number;
        attendance_percentage: number;
      };
    }>(`/reports/summary${params.toString() ? `?${params}` : ""}`);
  },
};

