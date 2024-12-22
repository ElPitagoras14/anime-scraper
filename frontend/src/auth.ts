import NextAuth, { DefaultSession } from "next-auth";
import { jwtDecode, JwtPayload } from "jwt-decode";
import Credentials from "next-auth/providers/credentials";
import axios from "axios";

interface CustomJWTPayload extends JwtPayload {
  sub: string;
  username: string;
  is_admin: boolean;
  is_active: boolean;
  avatar: string;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      isAdmin: boolean;
      isActive: boolean;
      avatar: string;
      token: string;
    } & DefaultSession["user"];
  }
}

const BACKEND_URL = process.env.NEXT_PUBLIC_SERVER_BACKEND_URL;
const MAX_AGE = parseInt(process.env.AUTH_EXPIRE_MINUTES || "120");

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const loginOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          url: `${BACKEND_URL}/api/v2/auth/login`,
          data: credentials,
        };

        try {
          const response = await axios(loginOptions);
          const {
            data: {
              payload: { token },
            },
          } = response;
          if (!token) {
            throw new Error("Invalid token");
          }

          const decodedToken = jwtDecode<CustomJWTPayload>(token);
          const {
            sub,
            username,
            is_admin: isAdmin,
            is_active: isActive,
            avatar,
          } = decodedToken;
          const user = {
            id: sub as string,
            username: username as string,
            isAdmin: isAdmin as boolean,
            isActive: isActive as boolean,
            avatar: avatar as string,
            token,
          };
          return user;
        } catch (error: any) {
          throw new Error("Something went wrong, please try again later");
        }
      },
    }),
  ],
  jwt: {
    maxAge: MAX_AGE * 60,
  },
  callbacks: {
    jwt({ token, user, session }) {
      if (user) {
        token.user = user;
      }
      if (session) {
        token.user = session.user;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user = token.user as any;
      }
      return session;
    },
  },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
});
