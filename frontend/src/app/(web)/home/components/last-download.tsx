"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import apiClient from "@/lib/api-client";
import { EpisodeDownload } from "@/lib/interfaces";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { useQuery } from "@tanstack/react-query";
import { DownloadIcon, SearchIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getLastDownloadEpisodes = () => {
  const options = {
    method: "GET",
    url: "/animes/download/last",
  };

  return apiClient(options);
};

interface LastDownloadProps {
  role: string;
}

export default function LastDownload({ role }: LastDownloadProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["last-download"],
    queryFn: () => getLastDownloadEpisodes(),
    refetchOnWindowFocus: false,
  });

  const lastDownloads = data?.data?.payload?.items.slice(0, 4) || [];

  if (isLoading) {
    return (
      <Card className="col-span-3">
        <CardContent className="flex flex-col gap-y-2">
          <span className="text-sm font-semibold">Last Downloaded</span>
          <Skeleton className="h-18 w-full" />
          <Skeleton className="h-18 w-full" />
          <Skeleton className="h-18 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-3">
      <CardContent className="flex flex-col gap-y-4">
        <span className="text-sm font-semibold">Last Downloaded</span>
        <ItemGroup className="grid grid-cols-2 gap-x-4 gap-y-2">
          {lastDownloads?.map((episode: EpisodeDownload) => (
            <Item key={episode.id} variant="outline">
              <ItemContent>
                <Tooltip key={episode.id}>
                  <TooltipTrigger>
                    <SearchIcon className="size-5" />
                  </TooltipTrigger>
                  <TooltipContent className="p-0 m-0 border">
                    <Image
                      src={episode.poster}
                      alt={episode.title}
                      width={150}
                      height={200}
                      className="rounded-md"
                    />
                  </TooltipContent>
                </Tooltip>
              </ItemContent>
              <ItemContent>
                <ItemTitle>
                  <Link href={`/anime/${episode.animeId}`}>
                    {episode.title}
                  </Link>
                </ItemTitle>
                <ItemDescription>
                  Episode {episode.episodeNumber}
                </ItemDescription>
              </ItemContent>
              <ItemContent className="">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={role === "guest"}
                  onClick={() =>
                    (window.location.href = `${API_URL}/api/animes/download/episode/${episode.id}`)
                  }
                  className="cursor-pointer"
                >
                  <DownloadIcon />
                </Button>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
