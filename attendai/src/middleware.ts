import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Routes that require a Supabase session
const PROTECTED_PREFIXES = ["/admin", "/teacher", "/student", "/setup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Create Supabase SSR client using request cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // Unauthenticated user trying to access a protected route → redirect to login
  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirected", "1");
    return NextResponse.redirect(loginUrl);
  }

  // Note: We do NOT redirect authenticated users away from /login here.
  // The login page's own client-side code handles routing to /setup or a
  // dashboard after checking the database profile status.

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - auth/callback (Supabase auth redirect handler)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|auth/callback).*)",
  ],
};
