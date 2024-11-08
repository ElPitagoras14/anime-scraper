import React from "react";
import ProtectedPage from "@/components/pageComponents/ProtectedPage";

export default function ScraperLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedPage>{children}</ProtectedPage>;
}
