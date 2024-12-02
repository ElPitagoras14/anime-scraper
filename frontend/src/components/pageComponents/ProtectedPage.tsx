"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { Icons } from "../ui/icons";

export default function ProtectedPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data, status, update } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    },
  });

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-svh">
        <Icons.spinner className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
