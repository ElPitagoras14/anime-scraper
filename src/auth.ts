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
  profileImg: string;
}

interface CustomUser extends DefaultUser {
  id: string;
  username: string;
  isAdmin: boolean;
  isActive: boolean;
  profileImg: string;
  token: string;
}

declare module "next-auth" {
  interface Session {
    user: DefaultUser & {
      id: string;
      username: string;
      isAdmin: boolean;
      isActive: boolean;
      profileImg: string;
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
              profileImg,
            } = decodedToken;
            const user = {
              id: sub as string,
              username: username as string,
              isAdmin: isAdmin as boolean,
              isActive: isActive as boolean,
              profileImg: profileImg as string,
              token,
            };
            return user;
          }
          return null;
        } catch (error) {
          throw new Error("Login failed");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: User }) {
      const parsedUser = user as CustomUser;
      if (user) {
        token = {
          ...token,
          ...parsedUser,
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
