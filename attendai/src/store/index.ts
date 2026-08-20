import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import type { AuthUser, UserRole } from "@/types";
import { supabase } from "@/lib/supabase/client";
import { authApi, invitationsApi } from "@/lib/api";

// ─────────────────────────────────────────
// Auth Store
// ─────────────────────────────────────────

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  hydrateFromSupabase: () => Promise<void>;
  syncProfile: (session?: any) => Promise<AuthUser>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false, isLoading: false });
      },
      hydrateFromSupabase: async () => {
        set({ isLoading: true });

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        try {
          const result = await authApi.me();
          const profile = result.data.profile;
          const organization = result.data.organization;

          const authUser: AuthUser = {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role,
            organization_id: profile.organization_id,
            organization: {
              id: organization.id,
              name: organization.name,
              slug: organization.domain,
              logo_url: "",
              plan: "starter",
            },
          };

          set({ user: authUser, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
          const errMsg = err?.message || "";
          if (errMsg.includes("profile was not found")) {
            console.warn("User has no database profile yet (onboarding expected):", errMsg);
          } else {
            console.error("Hydration failed to fetch profile from database:", err);
          }
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
      syncProfile: async (providedSession?: any) => {
        set({ isLoading: true });
        let session = providedSession;
        if (!session) {
          const { data } = await supabase.auth.getSession();
          session = data.session;
        }
        if (!session) {
          set({ isLoading: false });
          throw new Error("No active session found");
        }

        let profileData;
        try {
          // Try to fetch profile from backend /auth/me
          const result = await authApi.me();
          profileData = result.data;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }

        const profile = profileData.profile;
        const organization = profileData.organization;

        const authUser: AuthUser = {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          organization_id: profile.organization_id,
          organization: {
            id: organization.id,
            name: organization.name,
            slug: organization.domain,
            logo_url: "",
            plan: "starter",
          },
        };

        set({ user: authUser, isAuthenticated: true, isLoading: false });
        return authUser;
      },
    }),
    {
      name: "IntelliPresence-auth",
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// ─────────────────────────────────────────
// UI Store
// ─────────────────────────────────────────

interface UIState {
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  mobileMenuOpen: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      mobileMenuOpen: false,
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
    }),
    {
      name: "IntelliPresence-ui",
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);

// ─────────────────────────────────────────
// Attendance Store
// ─────────────────────────────────────────

import type { AttendanceRecord, AttendanceStatus } from "@/types";

interface AttendanceSessionDraft {
  sessionId: string | null;
  classId: string | null;
  date: string;
  records: Record<string, AttendanceStatus>; // studentId → status
  isDirty: boolean;
  isSaving: boolean;
}

interface AttendanceState {
  draft: AttendanceSessionDraft;
  setSession: (sessionId: string, classId: string, date: string) => void;
  markStudent: (studentId: string, status: AttendanceStatus) => void;
  markAll: (studentIds: string[], status: AttendanceStatus) => void;
  setSaving: (isSaving: boolean) => void;
  clearDraft: () => void;
}

const defaultDraft: AttendanceSessionDraft = {
  sessionId: null,
  classId: null,
  date: new Date().toISOString().split("T")[0],
  records: {},
  isDirty: false,
  isSaving: false,
};

export const useAttendanceStore = create<AttendanceState>()(
  subscribeWithSelector((set) => ({
    draft: defaultDraft,
    setSession: (sessionId, classId, date) =>
      set({ draft: { ...defaultDraft, sessionId, classId, date } }),
    markStudent: (studentId, status) =>
      set((s) => ({
        draft: {
          ...s.draft,
          records: { ...s.draft.records, [studentId]: status },
          isDirty: true,
        },
      })),
    markAll: (studentIds, status) =>
      set((s) => ({
        draft: {
          ...s.draft,
          records: Object.fromEntries(studentIds.map((id) => [id, status])),
          isDirty: true,
        },
      })),
    setSaving: (isSaving) =>
      set((s) => ({ draft: { ...s.draft, isSaving } })),
    clearDraft: () => set({ draft: defaultDraft }),
  }))
);

// ─────────────────────────────────────────
// Notification Store
// ─────────────────────────────────────────

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decrementUnread: () => void;
  clearUnread: () => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  unreadCount: 2,
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  decrementUnread: () => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
  clearUnread: () => set({ unreadCount: 0 }),
}));
