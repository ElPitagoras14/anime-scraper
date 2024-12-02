import type { Metadata } from "next";
import { Nunito_Sans as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ReduxProvider } from "@/redux/ReduxProvider";
import AuthProvider from "@/providers/auth-provider";
import { getSession } from "@/auth";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Anime Scraper",
  description: "Scraper for anime websites",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider session={session}>
            <ReduxProvider>{children}</ReduxProvider>
          </AuthProvider>
          <Toaster></Toaster>
        </ThemeProvider>
      </body>
    </html>
  );
}
