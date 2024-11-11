"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { useToast } from "../ui/use-toast";
import { useEffect, useState } from "react";
import { Icons } from "../ui/icons";

export default function ProtectedPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, status, update } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    },
  });
  const router = useRouter();
  const [sessionExpired, setSessionExpired] = useState(false);

  const { user: { token = "" } = {} } = data || {};

  useEffect(() => {
    (async () => {
      if (status === "authenticated" && token && !sessionExpired) {
        console.log("Checking token expiration");
        const { exp } = jwtDecode(token);
        const now = Date.now() / 1000;

        if (!exp || exp < now) {
          setSessionExpired(true);
          (async () => {
            await signOut({ callbackUrl: "/login" });
          })();
        }
      }
    })();
    const interval = setInterval(() => {
      update();
    }, 20 * 60 * 1000);
    return () => clearInterval(interval);
  }, [update, status, token, sessionExpired]);

  useEffect(() => {
    const visibilityHandler = () =>
      document.visibilityState === "visible" && update();
    window.addEventListener("visibilitychange", visibilityHandler, false);
    return () =>
      window.removeEventListener("visibilitychange", visibilityHandler, false);
  }, [update]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-svh">
        <Icons.spinner className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
