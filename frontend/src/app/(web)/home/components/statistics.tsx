"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import apiClient from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

const getStatistics = () => {
  const options = {
    method: "GET",
    url: "/users/statistics",
  };

  return apiClient(options);
};

interface Statistics {
  savedAnimes: number;
  downloadedEpisodes: number;
  inEmissionAnimes: number;
}

export default function Statistics() {
  const { data, isLoading } = useQuery({
    queryKey: ["statistics"],
    queryFn: () => getStatistics(),
    refetchOnWindowFocus: false,
  });

  const statistics: Statistics = data?.data?.payload || {};

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-y-4">
          <span className="text-sm font-semibold">Statistics</span>
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-y-2">
        <span className="text-sm font-semibold">Statistics</span>
        <div className="flex flex-col gap-y-2">
          <p className="text-base font-semibold">Saved animes</p>
          <Badge className="text-sm">{statistics.savedAnimes}</Badge>
        </div>
        <div className="flex flex-col gap-y-2">
          <p className="text-base font-semibold">Downloaded episodes</p>
          <Badge className="text-sm">{statistics.downloadedEpisodes}</Badge>
        </div>
        <div className="flex flex-col gap-y-2">
          <p className="text-base font-semibold">Emission animes</p>
          <Badge className="text-sm">{statistics.inEmissionAnimes}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
