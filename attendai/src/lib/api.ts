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
async function apiRequest<T>(
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
    return apiRequest(`/students${params.toString() ? `?${params}` : ""}`);
  },

  me: () => apiRequest<{ data: { id: string; full_name: string; email: string; student_id: string; roll_number: string; department?: { name?: string; code?: string }; attendance_percentage?: number; attendance_summary?: { total_sessions: number; present_count: number; absent_count: number; late_count: number; excused_count: number; attendance_percentage: number } } }>("/students/me"),
  
  get: (id: string) => apiRequest(`/students/${id}`),
  
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
    return apiRequest(`/teachers${params.toString() ? `?${params}` : ""}`);
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
