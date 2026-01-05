"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMinutesAgo } from "@/lib/utils";
import InformationTab from "./components/information-tab";
import EpisodesTab from "./components/episodes-tab";
import SidebarInfo from "./components/sidebar-info";
import apiClient from "@/lib/api-client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface RelatedInfo {
  id: string;
  title: string;
  type: string;
}

interface EpisodeInfo {
  id: number;
  animeId: string;
  imagePreview: string;
  isUserDownloaded: boolean;
  isGlobalDownloaded: boolean;
}

const getAnimeInfo = async (id: string, forceUpdate: boolean = false) => {
  const options = {
    method: "GET",
    url: `/animes/info/${id}`,
    params: { force_update: forceUpdate },
  };

  return await apiClient(options);
};

export interface AnimeInfo {
  id: string;
  title: string;
  type: string;
  poster: string;
  isSaved: boolean;
  season: number;
  platform: string;
  description: string;
  genres: string[];
  otherTitles: string[];
  relatedInfo: RelatedInfo[];
  weekDay: string;
  episodes: EpisodeInfo[];
  isFinished: boolean;
  lastScrapedAt: string;
  lastForcedUpdate: string;
}

export default function Anime() {
  const params = useParams();
  const id = params.id as string;
  const [minutesAgo, setMinutesAgo] = useState<number | null>(null);
  const [minutesToWait, setMinutesToWait] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["anime", id],
    queryFn: () => getAnimeInfo(id),
    refetchOnWindowFocus: false,
  });

  const queryClient = useQueryClient();
  const anime = data?.data?.payload;

  useEffect(() => {
    if (!anime) return;

    const updateTimes = () => {
      setMinutesAgo(getMinutesAgo(new Date(anime.lastScrapedAt)));
      setMinutesToWait(5 - getMinutesAgo(new Date(anime.lastForcedUpdate)));
    };

    updateTimes();
    const interval = setInterval(updateTimes, 60 * 1000);

    return () => clearInterval(interval);
  }, [anime]);

  if (isLoading || !anime || minutesAgo === null || minutesToWait === null) {
    return (
      <>
        <div className="lg:hidden mb-4">
          <span className="text-2xl font-semibold animate-pulse">
            Longs animes will take a long time to load the first time...
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 px-2 xl:px-12 gap-y-4">
          <div className="flex flex-col gap-y-4 items-center lg:items-start">
            <Skeleton className="w-60 h-96" />
            <Skeleton className="w-60 h-20" />
          </div>
          <div className="flex flex-col col-span-1 lg:col-span-2 xl:col-span-3 gap-y-4">
            <div className="hidden lg:flex flex-row justify-between ">
              <div className="flex flex-col gap-y-4">
                <span className="text-2xl font-semibold animate-pulse  text-wrap">
                  Longs animes will take a long time to load the first time...
                </span>
                <Skeleton className="w-full h-18" />
              </div>
            </div>
            <div className="flex flex-col gap-y-4">
              <div className="flex flex-col gap-y-2">
                <Skeleton className="w-56 h-10" />
                <Skeleton className="w-full h-36" />
              </div>
              <div className="flex flex-col gap-y-2">
                <Skeleton className="w-56 h-10" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="w-full sm:w-96 h-10" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 px-2 gap-x-12 xl:px-12 gap-y-4 pb-20">
      <SidebarInfo anime={anime} />
      <div className="flex flex-col col-span-1 lg:col-span-2 xl:col-span-3 gap-y-4">
        <div className="flex flex-row justify-between">
          <div className="flex flex-col gap-y-1">
            <span className="text-xl md:text-2xl lg:text-3xl font-semibold">{anime.title}</span>
            <span className="text-sm text-muted-foreground">
              Last update {minutesAgo} minutes ago
            </span>
          </div>
          <div className="flex flex-col gap-y-1 justify-center text-center">
            <Button
              variant="destructive"
              className="cursor-pointer"
              disabled={minutesToWait > 0}
              onClick={async () => {
                const freshData = await getAnimeInfo(id, true);
                queryClient.setQueryData(["anime", id], freshData);
              }}
            >
              Force update
            </Button>
            <span className="text-sm text-muted-foreground">
              {minutesToWait > 0
                ? `Wait ${minutesToWait} minutes to use`
                : "Ready to use"}
            </span>
          </div>
        </div>
        <Tabs defaultValue="information">
          <TabsList className="w-full lg:w-124 h-10">
            <TabsTrigger value="information" className="w-full text-base">
              Information
            </TabsTrigger>
            <TabsTrigger value="episodes" className="w-full text-base">
              Episodes
            </TabsTrigger>
          </TabsList>
          <TabsContent value="information">
            <InformationTab anime={anime} />
          </TabsContent>
          <TabsContent value="episodes">
            <EpisodesTab anime={anime} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
