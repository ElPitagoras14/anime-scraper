"use client";

import { Icons } from "@/components/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { Bookmark } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

interface AnimeInfoProps {
  name: string;
  animeId: string;
  isSaved: boolean;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const getAnimeInfo = async (animeId: string, token: string) => {
  const animeInfoOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: `${BACKEND_URL}/api/v2/animes/info/${animeId}`,
  };

  const animeInfoResponse = await axios(animeInfoOptions);

  const {
    data: { payload: animeInfoPayload },
  } = animeInfoResponse;

  return animeInfoPayload;
};

const changeSavedAnime = async (
  isSaving: boolean,
  animeId: string,
  token: string
) => {
  const saveOptions = {
    method: isSaving ? "POST" : "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: `${BACKEND_URL}/api/v2/animes/saved/${animeId}`,
  };
  await axios(saveOptions);
};

export default function CustomTooltip({
  name,
  animeId,
  isSaved,
}: AnimeInfoProps) {
  const [currentIsSaved, setCurrentIsSaved] = useState(isSaved);
  const [isLoadingSaving, setIsLoadingSaving] = useState(false);
  const { toast } = useToast();
  const { data } = useSession();
  const { user: { token = "" } = {} } = data || {};

  const handleChangeSavedAnime = async (isSaving: boolean) => {
    setIsLoadingSaving(true);
    try {
      await getAnimeInfo(animeId, token);
      await changeSavedAnime(isSaving, animeId, token);
      toast({
        title: `${name} ${isSaving ? "added" : "removed"} to saved`,
      });
      setCurrentIsSaved(isSaving);
    } catch (error) {
      toast({
        title: `${name} ${isSaving ? "added" : "removed"} to saved`,
      });
    } finally {
      setIsLoadingSaving(false);
    }
  };

  return (
    <div
      className="absolute top-0 end-1 pt-[0.3rem] px-[0.2rem] m-1 rounded-md bg-[#020817]/80 hover:cursor-pointer mt-2"
      onClick={async (e) => {
        e.stopPropagation();
        await handleChangeSavedAnime(!currentIsSaved);
      }}
    >
      <TooltipProvider>
        <Tooltip>
          {isLoadingSaving ? (
            <Icons.spinner className="h-6 w-6 mb-1 animate-spin hover:cursor-pointer" />
          ) : currentIsSaved ? (
            <>
              <TooltipTrigger>
                <Bookmark
                  fill="hsl(var(--primary))"
                  className="h-6 w-6 text-primary"
                ></Bookmark>
              </TooltipTrigger>
              <TooltipContent>Remove from saved</TooltipContent>
            </>
          ) : (
            <>
              <TooltipTrigger>
                <Bookmark className="h-6 w-6 text-white"></Bookmark>
              </TooltipTrigger>
              <TooltipContent>Add to saved</TooltipContent>
            </>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
