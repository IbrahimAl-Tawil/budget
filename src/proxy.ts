import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public pages that don't need auth
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");
  const isApi = pathname.startsWith("/api");

  // Always allow API routes
  if (isApi) return NextResponse.next();

  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET });
  const isLoggedIn = !!token;
  const onboardingDone = token?.onboardingDone as boolean | undefined;

  // Public pages: allow access, but redirect logged-in users from auth pages
  if (isPublic) {
    // Landing page: let everyone see it (the page itself redirects logged-in users)
    if (pathname === "/") return NextResponse.next();

    // Login/register: redirect logged-in users to dashboard or onboarding
    if (isLoggedIn) {
      return NextResponse.redirect(
        new URL(onboardingDone ? "/dashboard" : "/onboarding", request.url)
      );
    }
    return NextResponse.next();
  }

  // Protected pages: require auth
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Onboarding flow
  const isOnboarding = pathname.startsWith("/onboarding");
  if (!onboardingDone && !isOnboarding) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }
  if (onboardingDone && isOnboarding) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
