import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authToken = request.cookies.get("authToken")?.value;
  const authStage = request.cookies.get("authStage")?.value;
  const role = request.cookies.get("role")?.value;

  if (pathname.startsWith("/otp")) {
    if (authStage !== "otp") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!authToken || role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard/camaba")) {
    if (!authToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/otp/:path*", "/admin/:path*", "/dashboard/camaba", "/dashboard/camaba/:path*"],
};
