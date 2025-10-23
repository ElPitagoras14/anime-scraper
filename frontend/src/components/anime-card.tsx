"use client";

import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BookmarkIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api-client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Spinner } from "./ui/spinner";

export interface AnimeInfo {
  id: string;
  title: string;
  poster: string;
  type: string;
  isSaved: boolean;
  saveDate: string;
}

const saveAnime = (animeId: string) => {
  const options = {
    method: "PUT",
    url: `/animes/save/${animeId}`,
  };

  return apiClient(options);
};

const unsaveAnime = (animeId: string) => {
  const options = {
    method: "PUT",
    url: `/animes/unsave/${animeId}`,
  };

  return apiClient(options);
};

interface AnimeCardProps {
  animeInfo: AnimeInfo;
}

export default function AnimeCard({ animeInfo }: AnimeCardProps) {
  const [isSaved, setIsSaved] = useState<boolean>(animeInfo.isSaved);

  const router = useRouter();

  const saveMutation = useMutation({
    mutationFn: saveAnime,
    onSuccess: () => {
      toast.success(`${animeInfo.title} saved`);
    },
    onError: (error: AxiosError) => {
      let message = error.message;

      if (error.isAxiosError) {
        const axiosError = error as AxiosError<{ message: string }>;
        message = axiosError.response?.data?.message || axiosError.message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      setIsSaved(false);

      toast.error(message);
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: unsaveAnime,
    onSuccess: () => {
      toast.success(`${animeInfo.title} unsaved`);
    },
    onError: (error: AxiosError) => {
      let message = error.message;

      if (error.isAxiosError) {
        const axiosError = error as AxiosError<{ message: string }>;
        message = axiosError.response?.data?.message || axiosError.message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      setIsSaved(true);

      toast.error(message);
    },
  });

  const isLoading = saveMutation.isPending || unsaveMutation.isPending;

  const handleSave = () => {
    if (!isSaved) {
      setIsSaved(true);
      saveMutation.mutate(animeInfo.id);
    } else {
      setIsSaved(false);
      unsaveMutation.mutate(animeInfo.id);
    }
  };

  return (
    <div
      className="flex flex-col gap-y-2 cursor-pointer"
      onClick={() => router.push(`/anime/${animeInfo.id}`)}
    >
      <div className="relative w-46 h-64">
        <Image
          className="rounded-md object-cover"
          src={animeInfo.poster}
          alt={animeInfo.title}
          fill
        />
        {isLoading ? (
          <div className="absolute top-1 right-1">
            <div
              className="px-1 py-1 rounded-md bg-background/60"
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
            >
              <Spinner className="size-6"/>
            </div>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild className="absolute top-1 right-1">
              <div
                className="px-1 py-1 rounded-md bg-background/60"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
              >
                {isSaved ? (
                  <BookmarkIcon
                    className="w-6 h-6 text-indigo-500"
                    fill="currentColor"
                  />
                ) : (
                  <BookmarkIcon className="w-6 h-6" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isSaved ? "Remove from saved" : "Add to saved"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex justify-center items-center">
        <div className="max-w-44 text-base text-wrap text-center">
          {animeInfo.title}
        </div>
      </div>
    </div>
  );
}
