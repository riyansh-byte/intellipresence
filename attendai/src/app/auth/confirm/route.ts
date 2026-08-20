import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const requestedNext = requestUrl.searchParams.get("next");
  
  // Default to root page or callback, but if next is provided, route there
  const next = requestedNext?.startsWith("/") ? requestedNext : "/";
  const redirectUrl = new URL(next, request.url);

  if (code || (token_hash && type)) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (err) {
              // The setAll method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
              console.warn("setAll failed in auth confirm route handler:", err);
            }
          },
        },
      }
    );

    let error = null;
    if (code) {
      const res = await supabase.auth.exchangeCodeForSession(code);
      error = res.error;
    } else if (token_hash && type) {
      const res = await supabase.auth.verifyOtp({
        token_hash,
        type,
      });
      error = res.error;
    }

    if (!error) {
      // For invite-type tokens the /auth/callback page must run first so it can
      // call invitationsApi.accept() and create the profile in our database.
      // Only after that should the user be sent to reset-password.
      if (type === "invite") {
        const callbackUrl = new URL("/auth/callback", request.url);
        callbackUrl.searchParams.set("next", "/reset-password");
        return NextResponse.redirect(callbackUrl);
      }
      return NextResponse.redirect(redirectUrl);
    }

    console.error("Auth confirmation failed:", error);
    const errorUrl = new URL("/login", request.url);
    errorUrl.searchParams.set("auth_error", error.message);
    return NextResponse.redirect(errorUrl);
  }

  // If no validation parameters, redirect to login page
  console.warn("Auth confirmation hit without code or token_hash/type");
  return NextResponse.redirect(new URL("/login", request.url));
}
