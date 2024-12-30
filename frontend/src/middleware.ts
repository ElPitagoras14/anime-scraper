import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (
    req.auth &&
    (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/register")
  ) {
    return NextResponse.redirect("/scraper");
  }

  if (
    !req.auth &&
    (req.nextUrl.pathname !== "/login" && req.nextUrl.pathname !== "/register")
  ) {
    const newUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(newUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/login", "/register", "/scraper/:path*"],
};
