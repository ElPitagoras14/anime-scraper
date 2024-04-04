"use client";

import Link from "next/link";
import { ModeToggle } from "../ModeToggle";
import {
  TypographyH4,
  TypographyH5,
} from "../ui/typography";
import { Input } from "@/components/ui/input";
import { Separator } from "../ui/separator";
import { Search, Settings, CalendarDays, Download } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { useAppSelector } from "@/redux/hooks";

export const Header = () => {
  const { queue } = useAppSelector(
    (state: { downloadReducer: any }) => state.downloadReducer
  );

  const [animeName, setAnimeName] = useState<string>("");
  const router = useRouter();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      router.push(`/search?anime=${animeName}`);
    }
  };

  return (
    <header className="sticky top-0 z-50">
      <nav className="bg-background">
        <div className="flex justify-between px-12 py-4">
          <div className="flex items-center">
            <TypographyH4>Anime Scraper</TypographyH4>
          </div>
          <div className="flex items-center space-x-6 text-nowrap">
            <Link href={"/saved"} className="hover:text-primary">
              <TypographyH5>Saved Anime</TypographyH5>
            </Link>
            <Link href={"/calendar"} className="hover:text-primary">
              <CalendarDays></CalendarDays>
            </Link>
            <Link
              href={"/downloads"}
              className="hover:text-primary flex items-center space-x-1"
            >
              <Download></Download>
              <span className="mt-0">
                {queue.length > 0 ? `(${queue.length})` : ""}
              </span>
            </Link>
            <Input
              value={animeName}
              onChange={(e) => {
                setAnimeName(e.target.value);
              }}
              placeholder="Search"
              icon={Search}
              iconFn={() => {
                if (animeName !== "") {
                  router.push(`/search?anime=${animeName}`);
                }
              }}
              onKeyDown={handleKeyDown}
            />
            <ModeToggle></ModeToggle>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                router.push("/settings");
              }}
            >
              <Settings></Settings>
            </Button>
          </div>
        </div>
      </nav>
      <Separator></Separator>
    </header>
  );
};
