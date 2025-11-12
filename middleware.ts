import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const ADMIN_MATCHERS = ['/admin', '/api/admin'];

function isAdminPath(pathname: string) {
  return ADMIN_MATCHERS.some((matcher) => pathname === matcher || pathname.startsWith(`${matcher}/`));
}

export async function middleware(req: NextRequest) {
  if (!isAdminPath(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          res.cookies.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  const isApiRoute = req.nextUrl.pathname.startsWith('/api/');

  if (authError || !user) {
    if (isApiRoute) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirectTo', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile, error: profileError } = await supabase
    .from('Profile')
    .select('role, isSuspended')
    .eq('supabaseId', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    if (isApiRoute) {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden' }),
        {
          status: 403,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/';
    redirectUrl.searchParams.set('admin', 'forbidden');
    return NextResponse.redirect(redirectUrl);
  }

  if (profile.isSuspended) {
    if (isApiRoute) {
      return new NextResponse(
        JSON.stringify({ error: 'Account suspended' }),
        {
          status: 403,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    const suspendedUrl = req.nextUrl.clone();
    suspendedUrl.pathname = '/';
    suspendedUrl.searchParams.set('admin', 'suspended');
    return NextResponse.redirect(suspendedUrl);
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
