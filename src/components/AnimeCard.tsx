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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const saveAnime = () => {
    setIsLoading(true);
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      url: `${BACKEND_URL}/api/v2/animes/saved`,
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
      url: `${BACKEND_URL}/api/v2/animes/saved/single/${animeId}`,
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
    <div className="flex flex-col mb-4 items-center">
      <div
        className="relative hover:cursor-pointer min-w-[120px] w-[20vw] lg:w-[20vw] lg:max-w-[180px] min-h-[200px] h-[30vw] lg:h-[30vw] lg:max-h-[250px] flex justify-center"
        onClick={() => {
          router.push(`/scraper/info/${animeId}`);
        }}
      >
        <Image
          src={imageSrc}
          alt=""
          layout="fill"
          className="rounded-md object-cover"
        />
        {/* <div
          className={`absolute top-0.5 end-0.5 pt-[0.3rem] px-[0.2rem] m-1 rounded-md bg-[#020817]/80`}
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
        </div> */}
      </div>
      <TypographyH5 className="text-center mt-4 text-wrap min-w-[120px] w-[20vw] lg:w-[20vw] lg:max-w-[180px]">
        {name}
      </TypographyH5>
    </div>
  );
};
