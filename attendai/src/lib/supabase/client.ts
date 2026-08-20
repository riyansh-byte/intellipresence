import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-supabase-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";

/**
 * Creates a Supabase client using implicit auth flow (Magic Token Links).
 *
 * WHY IMPLICIT FLOW FOR PASSWORD RESET?
 * PKCE flow requires a `code_verifier` stored in the initiating browser session.
 * If a user requests a reset email in Browser A (or one tab) and opens the email
 * link in Browser B (or an incognito tab / external app), PKCE fails with:
 * "PKCE code verifier not found in storage".
 *
 * Implicit flow delivers the session tokens directly in the email link hash
 * (`#access_token=...&refresh_token=...`), making password reset links work
 * 100% reliably across ANY browser, device, incognito window, or email app.
 */
export function createSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "implicit",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * Shared singleton client for general use across the application.
 */
export const supabase = createSupabaseClient();
