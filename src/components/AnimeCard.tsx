"use client";

import { Bookmark } from "lucide-react";
import Image from "next/image";
import { TypographyH5 } from "./ui/typography";
import { useEffect, useState } from "react";
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

interface AnimeCardProps {
  name: string;
  imageSrc: string;
  animeId: string;
  saved: boolean;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const AnimeCard = ({
  name,
  imageSrc,
  animeId,
  saved,
}: AnimeCardProps) => {
  const { toast } = useToast();
  const router = useRouter();

  const [isSaved, setIsSaved] = useState<boolean>(saved);
  const [showBookmark, setShowBookmark] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setShowBookmark(isSaved);
  }, [isSaved]);

  const saveAnime = () => {
    setIsLoading(true);
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      url: `${BACKEND_URL}/api/v1/anime/saved`,
      data: {
        anime_id: animeId,
        name,
        image_src: imageSrc,
        week_day: null,
      },
    };
    axios(options)
      .then((response) => {
        setIsSaved(true);
        toast({
          title: `${name} added to saved`,
        });
      })
      .catch((error) => {
        toast({
          title: "Error saving anime",
          description: "Please try again later",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const unsaveAnime = () => {
    setIsLoading(true);
    const options = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      url: `${BACKEND_URL}/api/v1/anime/saved/single/${animeId}`,
    };
    axios(options)
      .then((response) => {
        setIsSaved(false);
        toast({
          title: `${name} removed from saved`,
        });
      })
      .catch((error) => {
        toast({
          title: "Error removing anime",
          description: "Please try again later",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div
      className="relative hover:cursor-pointer w-[200px] mb-4 mr-6"
      onClick={() => {
        router.push(`/anime/${animeId}`);
      }}
      onMouseEnter={() => {
        if (!isSaved) {
          setShowBookmark(true);
        }
      }}
      onMouseLeave={() => {
        if (!isSaved) {
          setShowBookmark(false);
        }
      }}
    >
      <Image
        src={imageSrc}
        alt={""}
        width={200}
        height={200}
        className="rounded-md"
      ></Image>
      <div
        className={`absolute top-0.5 end-0.5 pt-[0.3rem] px-[0.2rem] m-1 rounded-md ${
          showBookmark ? "bg-[#020817]/80" : "hidden"
        } hover:cursor-pointer`}
        onClick={(e) => {
          e.stopPropagation();
          if (isSaved) {
            unsaveAnime();
          } else {
            saveAnime();
          }
          setIsSaved(!isSaved);
        }}
      >
        <TooltipProvider>
          <Tooltip>
            {isLoading ? (
              <Icons.spinner className="h-6 w-6 mb-1 animate-spin" />
            ) : isSaved ? (
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
      <TypographyH5 className="text-center mt-4 text-wrap">{name}</TypographyH5>
    </div>
  );
};
