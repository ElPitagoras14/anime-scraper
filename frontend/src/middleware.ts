import { auth } from "@/auth";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

const AUTH_SECRET = "secret";

const unprotectedPaths = ["/login", "/register", "/"];

export default auth(async (req) => {
  const token = await getToken({
    req,
    secret: AUTH_SECRET,
  });
  const baseUrl = req.nextUrl.origin;

  if (unprotectedPaths.includes(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  if (token && Date.now() >= token.data.validity.refreshUntil * 1000) {
    const response = NextResponse.redirect(`${baseUrl}/login`);
    response.cookies.set("next-auth.session-token", "", { maxAge: 0 });
    response.cookies.set("next-auth.csrf-token", "", { maxAge: 0 });

    return response;
  }

  // If authenticated, continue with the request
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
