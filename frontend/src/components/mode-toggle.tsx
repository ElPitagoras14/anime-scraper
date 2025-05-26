"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  const toggle = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div
      className="hover:bg-accent p-2 rounded-md cursor-pointer"
      onClick={toggle}
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5 scale-100 rotate-0 transition-all" />
      ) : (
        <Sun className="h-5 w-5 scale-100 rotate-0 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </div>
  );
}
