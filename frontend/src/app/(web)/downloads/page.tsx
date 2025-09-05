"use client";

import { useQuery } from "@tanstack/react-query";
import { getAnimeColumns, EpisodeDownload } from "./components/columns";
import apiClient from "@/lib/api-client";
import { useEffect, useRef, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { useSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface QueryParams {
  sorting?: {
    id: string;
    desc: boolean;
  }[];
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
}

interface DownloadParams {
  limit: number;
  page: number;
  anime_id?: string;
}

const getDownloads = (animeId: string, queryParams: QueryParams) => {
  const { pagination: { pageIndex = 0, pageSize = 10 } = {} } = queryParams;

  const params: DownloadParams = {
    limit: pageSize,
    page: pageIndex + 1,
  };

  const options = {
    method: "GET",
    url: "/animes/download",
    params,
  };

  if (animeId) {
    options.params.anime_id = animeId;
  }

  return apiClient(options);
};

const getUniqueAnimes = () => {
  const options = {
    method: "GET",
    url: "/animes/download/anime",
  };
  return apiClient(options);
};

interface Anime {
  id: string;
  title: string;
}

export default function Downloads() {
  const [open, setOpen] = useState<boolean>(false);
  const [animeId, setAnimeId] = useState("");
  const [sorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: session } = useSession();

  const queryParams = {
    pagination,
    sorting,
  };

  const { data: animesData } = useQuery({
    queryKey: ["animes"],
    queryFn: getUniqueAnimes,
    refetchOnWindowFocus: false,
  });

  const { data: serverData, isLoading } = useQuery({
    queryKey: ["downloads", animeId, queryParams],
    queryFn: () => getDownloads(animeId, queryParams),
    refetchOnWindowFocus: false,
  });

  const [localData, setLocalData] = useState<EpisodeDownload[] | null>(
    serverData?.data?.payload?.items
  );

  const jobsMapRef = useRef<Record<string, number>>({});

  const items = serverData?.data?.payload?.items;
  const animes = animesData?.data?.payload?.items;

  const animeColumns = getAnimeColumns({
    role: session?.user?.role || "guest",
  });

  useEffect(() => {
    if (!serverData) return;
    setLocalData(serverData?.data?.payload?.items);
    const jobIds: string[] = [];
    const rawJobsMap: Record<string, number> = {};

    items.forEach((episode: EpisodeDownload, idx: number) => {
      if (episode.jobId) {
        jobIds.push(episode.jobId);
        rawJobsMap[episode.jobId] = idx;
      }
    });

    jobsMapRef.current = rawJobsMap;

    const source = new EventSource(
      `${API_URL}/api/animes/stream/download?job_ids=${jobIds.join(",")}`
    );

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { job_id, state, meta } = data;
        const idx = jobsMapRef.current[job_id];
        if (state !== localData?.[idx].status) {
          setLocalData((prevData) => {
            if (!prevData) return prevData;
            const newData = [...prevData];
            newData[idx] = {
              ...newData[idx],
              status: state,
            };
            return newData;
          });
        }
        if (meta.total) {
          const total = meta.total;
          const progress = meta.progress;
          if (idx !== undefined) {
            setLocalData((prevData) => {
              if (!prevData) return prevData;
              const newData = [...prevData];
              newData[idx] = {
                ...newData[idx],
                size: total,
                progress,
              };
              return newData;
            });
          }
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    };

    source.onerror = (error) => {
      console.error("Error:", error);
      source.close();
    };

    return () => {
      source.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverData]);

  return (
    <div className="flex flex-col gap-y-10">
      <span className="text-3xl font-semibold">Downloads</span>
      <div className="flex flex-col gap-y-4">
        <div>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="min-w-48 justify-between"
              >
                {animeId
                  ? animes.find((anime: Anime) => anime.id === animeId)?.title
                  : "All"}
                <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0">
              <Command>
                <CommandInput placeholder="Select an anime" />
                <CommandList>
                  <CommandEmpty>No downloads found</CommandEmpty>
                  <CommandGroup>
                    {animes?.map((anime: Anime) => (
                      <CommandItem
                        key={anime.id}
                        value={anime.id}
                        onSelect={(currentValue) => {
                          setAnimeId(
                            currentValue === animeId ? "" : currentValue
                          );
                          setOpen(false);
                        }}
                        className="flex items-center justify-between"
                      >
                        {anime.title}
                        <CheckIcon
                          className={cn(
                            "ml-auto",
                            animeId === anime.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <DataTable
          columns={animeColumns}
          data={localData || []}
          enableSelect={false}
          serverSide={{
            pagination: {
              value: pagination,
              onChange: setPagination,
            },
            totalRows: serverData?.data?.payload?.total,
            isLoading,
          }}
        />
      </div>
    </div>
  );
}
