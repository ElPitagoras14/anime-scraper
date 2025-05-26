import NextAuth from "next-auth";
import type {
  AuthValidity,
  BackendAccessJWT,
  BackendJWT,
  DecodedJWT,
  UserObject,
} from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { jwtDecode } from "jwt-decode";
import type { JWT } from "next-auth/jwt";
import axios from "axios";

const API_URL = process.env.API_URL;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const loginOptions = {
            method: "POST",
            url: `${API_URL}/api/auth/login`,
            data: {
              username: credentials.username,
              password: credentials.password,
            },
          };

          const response = await axios(loginOptions);
          const tokens: BackendJWT = response.data.payload;

          const access: DecodedJWT = jwtDecode(tokens.access);
          const refresh: DecodedJWT = jwtDecode(tokens.refresh);

          const user: UserObject = {
            id: access.id,
            username: access.username,
            isActive: access.isActive,
            role: access.role,
          };

          const validity: AuthValidity = {
            validUntil: access.exp,
            refreshUntil: refresh.exp,
          };

          return {
            tokens,
            user,
            validity,
          };
        } catch (error) {
          console.error(error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, account }) => {
      if (user && account) {
        console.log("Initial signin");
        return { ...token, data: user };
      }

      if (Date.now() < token.data.validity.validUntil * 1000) {
        return token;
      }

      if (Date.now() < token.data.validity.refreshUntil * 1000) {
        const refreshOptions = {
          method: "POST",
          url: `${API_URL}/api/auth/refresh`,
          params: {
            refresh_token: token.data.tokens.refresh,
          },
        };
        const response = await axios(refreshOptions);
        const newToken: BackendAccessJWT = response.data.payload;
        const { exp }: DecodedJWT = jwtDecode(newToken.access);
        token.data.validity.validUntil = exp;
        token.data.tokens.access = newToken.access;
        return token;
      }

      return { ...token, error: "RefreshTokenExpired" } as JWT;
    },
    session: async ({ session, token }) => {
      const data = token.data;

      return {
        ...session,
        user: data.user,
        accessToken: data.tokens.access,
        validity: data.validity,
        error: token.error,
      };
    },
  },
  pages: {
    signIn: "/",
  },
  trustHost: true,
});
