import { AuthOptions, getServerSession, DefaultUser, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";
import { jwtDecode, JwtPayload } from "jwt-decode";

const BACKEND_URL = process.env.NEXT_PUBLIC_SERVER_BACKEND_URL;

interface CustomJWTPayload extends JwtPayload {
  sub: string;
  username: string;
  is_admin: boolean;
  is_active: boolean;
  avatar: string;
}

interface CustomUser extends DefaultUser {
  id: string;
  username: string;
  isAdmin: boolean;
  isActive: boolean;
  avatar: string;
  token: string;
}

declare module "next-auth" {
  interface Session {
    user: DefaultUser & {
      id: string;
      username: string;
      isAdmin: boolean;
      isActive: boolean;
      avatar: string;
      token: string;
    };
  }
}

const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
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
          if (token) {
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
          }
          return null;
        } catch (error: any) {
          if (!error.response) {
            throw new Error("Connection error");
          }

          const { response: { data: { message = "" } = {} } = {} } = error;
          throw new Error(message);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      const parsedUser = user as CustomUser;
      if (user) {
        token = {
          ...token,
          ...parsedUser,
        };
      }
      if (trigger === "update" && session) {
        token = {
          ...token,
          ...session,
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user = { ...session.user, ...token };
      }
      return session;
    },
  },
};

const getSession = () => getServerSession(authOptions);

export { authOptions, getSession };
