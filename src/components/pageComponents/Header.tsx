"use client";

import Link from "next/link";
import { ModeToggle } from "../ModeToggle";
import { TypographyH4, TypographyH5, TypographyH6 } from "../ui/typography";
import { Input } from "@/components/ui/input";
import { Separator } from "../ui/separator";
import {
  Search,
  Settings,
  CalendarDays,
  Download,
  Bookmark,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { useAppSelector } from "@/redux/hooks";
import { useIsMobile } from "@/utils/utils";
import { IconLocationStar, IconMenu2 } from "@tabler/icons-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { signOut } from "next-auth/react";

export const Header = () => {
  const { queue } = useAppSelector(
    (state: { downloadReducer: any }) => state.downloadReducer
  );

  const [animeName, setAnimeName] = useState<string>("");
  const router = useRouter();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (animeName === "") return;
    if (event.key === "Enter") {
      router.push(`/scraper/search?anime=${animeName}`);
    }
  };

  return (
    <header className="sticky top-0 z-50">
      <nav className="bg-background">
        {useIsMobile() ? (
          <Accordion type="single" collapsible className="">
            <AccordionItem
              value="item-1"
              className="py-0 sm:py-1 px-2 sm:px-5 md:px-8 lg:px-12"
            >
              <div className="flex justify-between items-center pl-4">
                <div className="flex space-x-2">
                  <IconLocationStar className="w-8 h-8" />
                  <TypographyH4 className="hidden md:block">Anime Scraper</TypographyH4>
                </div>
                <div className="flex space-x-2 items-center">
                  <Input
                    value={animeName}
                    onChange={(e) => {
                      setAnimeName(e.target.value);
                    }}
                    placeholder="Search"
                    icon={Search}
                    iconFn={() => {
                      if (animeName !== "") {
                        router.push(`/scraper/search?anime=${animeName}`);
                      }
                    }}
                    onKeyDown={handleKeyDown}
                  />
                  <ModeToggle isMobile></ModeToggle>
                  <AccordionTrigger noIcon>
                    <Button variant={null} className="pr-2 pl-0 ml-0">
                      <IconMenu2 size={24} />
                    </Button>
                  </AccordionTrigger>
                </div>
              </div>
              <AccordionContent>
                <div className="flex flex-col items-end space-y-2 pr-2">
                  <Link href={"/scraper/saved"} className="hover:text-primary">
                    <TypographyH5>Saved Anime</TypographyH5>
                  </Link>
                  <Link
                    href={"/scraper/calendar"}
                    className="hover:text-primary"
                  >
                    <TypographyH5>Calendar</TypographyH5>
                  </Link>
                  <Link
                    href={"/scraper/downloads"}
                    className=" flex items-center space-x-1 hover:text-primary"
                  >
                    <TypographyH6>
                      Downloads &nbsp;
                      <span className="mt-0">
                        {queue.length > 0 ? `(${queue.length})` : ""}
                      </span>
                    </TypographyH6>
                  </Link>
                  <Link
                    href={"/scraper/settings"}
                    className="hover:text-primary"
                  >
                    <TypographyH6>Settings</TypographyH6>
                  </Link>
                  <Link
                    href={"#"}
                    className="hover:text-primary"
                    onClick={async () => {
                      await signOut({
                        redirect: false,
                      });
                    }}
                  >
                    <TypographyH6>Log out</TypographyH6>
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <div className="flex justify-between px-12 py-4">
            <div className="flex items-center space-x-4">
              <IconLocationStar className="w-8 h-8" />
              <TypographyH4>Anime Scraper</TypographyH4>
            </div>
            <div className="flex items-center space-x-6 text-nowrap">
              <Link href={"/scraper/saved"} className="hover:text-primary">
                <Bookmark></Bookmark>
              </Link>
              <Link href={"/scraper/calendar"} className="hover:text-primary">
                <CalendarDays></CalendarDays>
              </Link>
              <Link
                href={"/scraper/downloads"}
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
                    router.push(`/scraper/search?anime=${animeName}`);
                  }
                }}
                onKeyDown={handleKeyDown}
              />
              <div className="flex items-center space-x-4">
                <ModeToggle></ModeToggle>
                <Button
                  variant="outline"
                  className="mx-0 px-0 pl-0 ml-0"
                  size="icon"
                  onClick={() => {
                    router.push("/scraper/settings");
                  }}
                >
                  <Settings></Settings>
                </Button>
                <Button
                  variant="outline"
                  className="pl-0 ml-0"
                  size="icon"
                  onClick={async () => {
                    await signOut({
                      redirect: false,
                    });
                  }}
                >
                  <LogOut></LogOut>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
      <Separator></Separator>
    </header>
  );
};
