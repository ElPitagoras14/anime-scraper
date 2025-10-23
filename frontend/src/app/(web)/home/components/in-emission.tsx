"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import apiClient from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { InEmissionAnime } from "../../calendar/page";
import Image from "next/image";
import Link from "next/link";

const getInEmission = () => {
  const options = {
    method: "GET",
    url: "/animes/in-emission",
  };

  return apiClient(options);
};

const weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function InEmission() {
  const { data, isLoading } = useQuery({
    queryKey: ["in-emission"],
    queryFn: () => getInEmission(),
    refetchOnWindowFocus: false,
  });

  const currentDay = weekDays[new Date().getDay()];
  const animes = data?.data?.payload?.items || [];
  const todaysAnimes = animes.filter((anime: InEmissionAnime) => {
    return anime.weekDay === currentDay;
  });

  if (isLoading) {
    return (
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Today's Emitted</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-50 w-40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-4">
      <CardContent className="flex flex-col gap-y-4">
        <span className="text-sm font-semibold">Today's Emitted</span>
        <div className="flex flex-row">
          {todaysAnimes.map((anime: InEmissionAnime) => {
            return (
              <div className="flex flex-col justify-start items-center gap-y-2">
                <Link href={`/anime/${anime.id}`}>
                  <Image
                    src={anime.poster}
                    title={anime.title}
                    alt={anime.title}
                    width={130}
                    height={180}
                    className="rounded-md"
                  />
                </Link>
                <span className="text-center text-sm font-semibold w-40">
                  {anime.title}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
