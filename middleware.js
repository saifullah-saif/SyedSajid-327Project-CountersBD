import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Define protected routes
  const protectedRoutes = [
    "/user-dashboard",
    "/organizer-dashboard",
    "/interested",
    "/checkout",
    "/profile",
  ];

  // Check if the current path matches any protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If it's a protected route and there's no token, redirect to home
  if (isProtectedRoute && !token) {
    const url = new URL("/", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Allow the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/user-dashboard/:path*",
    "/organizer-dashboard/:path*",
    "/interested/:path*",
    "/checkout/:path*",
    "/profile/:path*",
  ],
};
