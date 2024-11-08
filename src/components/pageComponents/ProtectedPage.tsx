"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { useToast } from "../ui/use-toast";
import { useEffect, useState } from "react";

export default function ProtectedPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, status, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [sessionExpired, setSessionExpired] = useState(false);

  const { user: { token = "" } = {} } = data || {};

  useEffect(() => {
    const interval = setInterval(() => update(), 20 * 60 * 1000);
    return () => clearInterval(interval);
  }, [update]);

  useEffect(() => {
    const visibilityHandler = () =>
      document.visibilityState === "visible" && update();
    window.addEventListener("visibilitychange", visibilityHandler, false);
    return () =>
      window.removeEventListener("visibilitychange", visibilityHandler, false);
  }, [update]);

  if (status === "unauthenticated" && !sessionExpired) {
    router.push("/login");
  }

  if (status === "authenticated" && token && !sessionExpired) {
    const { exp } = jwtDecode(token);
    const now = Date.now() / 1000;

    if (!exp || exp < now) {
      setSessionExpired(true);
      (async () => {
        await signOut({ redirect: false });
        router.push("/login");
      })();
    }
  }

  return <>{children}</>;
}
