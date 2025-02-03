import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (
    req.auth &&
    (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/register")
  ) {
    const newUrl = new URL("/", req.nextUrl.origin);
    return NextResponse.redirect(newUrl);
  }

  if (req.auth) {
    return NextResponse.next();
  }

  if (
    req.nextUrl.pathname === "/login" ||
    req.nextUrl.pathname === "/register"
  ) {
    return NextResponse.next();
  }

  const newUrl = new URL("/login", req.nextUrl.origin);
  return NextResponse.redirect(newUrl);
});

export const config = {
  matcher: [
    "/login",
    "/register",
    "/",
    "/calendar",
    "/search",
    "/downloads",
    "/info/:path*",
    "/saved",
    "/settings",
  ],
};
