"use client";

import { Bookmark } from "lucide-react";
import Image from "next/image";
import { TypographyH5 } from "./ui/typography";
import { useState } from "react";
import { useToast } from "./ui/use-toast";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import axios from "axios";
import { Icons } from "./ui/icons";
import { signOut, useSession } from "next-auth/react";

interface AnimeCardProps {
  name: string;
  image: string;
  animeId: string;
  isSaved: boolean;
  setSavedAnime: (animeId: string, isSaved: boolean) => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const AnimeCard = ({
  name,
  image,
  animeId,
  isSaved,
  setSavedAnime,
}: AnimeCardProps) => {
  const { data } = useSession();
  const { user: { token = "" } = {} } = data || {};
  const { toast } = useToast();
  const router = useRouter();

  const [isLoadingSaving, setIsLoadingSaving] = useState<boolean>(false);

  const changeSavedAnime = async (isSaving: boolean) => {
    setIsLoadingSaving(true);
    try {
      const animeInfoOptions = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        url: `${BACKEND_URL}/api/v2/animes/info/${animeId}`,
      };
      await axios(animeInfoOptions);

      const saveOptions = {
        method: isSaving ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        url: `${BACKEND_URL}/api/v2/animes/saved/${animeId}`,
      };
      await axios(saveOptions);
      toast({
        title: `${name} ${isSaving ? "added to" : "removed from"} saved`,
      });

      setSavedAnime(animeId, isSaving);
    } catch (error: any) {
      if (!error.response) {
        toast({
          title: `Error ${isSaving ? "saving" : "removing"} anime`,
          description: "Please try again later",
        });
      }

      const { response: { status = 500 } = {} } = error;

      if (status === 401) {
        toast({
          title: "Unauthorized",
          description: "Please login again",
        });
        await signOut({
          callbackUrl: "/login",
        });
      }

      if (status === 409) {
        toast({
          title: `${name} already ${isSaving ? "saved" : "unsaved"}`,
        });
      }

      if (status === 500) {
        toast({
          title: "Server error",
          description: "Please try again later",
        });
      }
    } finally {
      setIsLoadingSaving(false);
    }
  };

  return (
    <div className="flex flex-col mb-4 items-center">
      <div
        className="relative hover:cursor-pointer min-w-[120px] w-[20vw] lg:w-[20vw] lg:max-w-[180px] min-h-[200px] h-[30vw] lg:h-[30vw] lg:max-h-[250px] flex justify-center"
        onClick={() => {
          router.push(`/scraper/info/${animeId}`);
        }}
      >
        <Image
          src={image}
          alt=""
          layout="fill"
          className="rounded-md object-cover"
        />
        <div
          className={`absolute top-0.5 end-0.5 pt-[0.3rem] px-[0.2rem] m-1 rounded-md bg-[#020817]/80`}
          onClick={async (e) => {
            e.stopPropagation();
            await changeSavedAnime(!isSaved);
          }}
        >
          <TooltipProvider>
            <Tooltip>
              {isLoadingSaving ? (
                <Icons.spinner className="h-5 lg:h-6 w-5 lg:w-6 mb-1 animate-spin" />
              ) : isSaved ? (
                <>
                  <TooltipTrigger>
                    <Bookmark
                      fill="hsl(var(--primary))"
                      className="h-5 lg:h-6 w-5 lg:w-6 text-primary"
                    ></Bookmark>
                  </TooltipTrigger>
                  <TooltipContent>Remove from saved</TooltipContent>
                </>
              ) : (
                <>
                  <TooltipTrigger>
                    <Bookmark className="h-5 lg:h-6 w-5 lg:w-6 text-white"></Bookmark>
                  </TooltipTrigger>
                  <TooltipContent>Add to saved</TooltipContent>
                </>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <TypographyH5 className="text-center mt-4 text-wrap min-w-[120px] w-[20vw] lg:w-[20vw] lg:max-w-[180px]">
        {name}
      </TypographyH5>
    </div>
  );
};
