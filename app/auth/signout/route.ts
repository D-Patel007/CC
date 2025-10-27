// app/auth/signout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Server-side signout:
 * - Clears the Supabase auth session (server)
 * - Clears auth cookies
 * - Redirects to home
 */
export async function POST() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
      },
    }
  );

  // Sign out via Supabase
  await supabase.auth.signOut();

  // Also ensure browser cookies are cleared
  const res = NextResponse.redirect(new URL("/", "http://localhost:3000"));
  res.cookies.set("sb-access-token", "", { maxAge: 0, path: "/" });
  res.cookies.set("sb-refresh-token", "", { maxAge: 0, path: "/" });

  return res;
}
