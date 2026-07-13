import { NextRequest, NextResponse } from "next/server";

const KNOWN_REGIONS = ["eu", "us", "tr"];
const DEFAULT_REGION = "eu";
const REGION_COOKIE = "store_region";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/my-account") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const cookieRegion = request.cookies.get(REGION_COOKIE)?.value?.toLowerCase();
  const activeRegion = cookieRegion && KNOWN_REGIONS.includes(cookieRegion) ? cookieRegion : DEFAULT_REGION;

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${activeRegion}`;
    return NextResponse.redirect(url);
  }

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0]?.toLowerCase();

  if (KNOWN_REGIONS.includes(firstSegment)) {
    const response = NextResponse.next();
    if (cookieRegion !== firstSegment) {
      response.cookies.set(REGION_COOKIE, firstSegment, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${activeRegion}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};