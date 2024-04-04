"use client";

import Image from "next/image";
import { Header } from "@/components/pageComponents/Header";
import {
  TypographyH3,
  TypographyH4,
  TypographyH5,
  TypographySmall,
} from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EpisodeInfo } from "@/components/EpisodeInfo";
import { useAppDispatch } from "@/redux/hooks";
import { useEffect, useState } from "react";
import axios from "axios";
import { addToQueue } from "@/redux/features/downloadSlice";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from "uuid";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Bookmark } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface AnimeInfo {
  name: string;
  finished: boolean;
  description: string;
  imageSrc: string;
  weekDay: string | null;
}

export default function AnimeDetail({ params }: { params: { name: string } }) {
  const { name: animeId } = params;
  const [animeInfo, setAnimeInfo] = useState<AnimeInfo>({
    name: "",
    finished: false,
    description: "",
    imageSrc: "",
    weekDay: null,
  });
  const { name, finished, description, imageSrc, weekDay } = animeInfo || {};
  const [streamingLinks, setStreamingLinks] = useState([]);

  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const [isLoadingAnimeInfo, setIsLoadingAnimeInfo] = useState(true);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(true);
  const [isLoadingDownload, setIsLoadingDownload] = useState(false);
  const [isLoadingSavedInfo, setIsLoadingSavedInfo] = useState(true);
  const [isLoadingSavingAnime, setIsLoadingSavingAnime] = useState(false);

  const [range, setRange] = useState<string>("");

  useEffect(() => {
    const animeInfoOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      url: `${BACKEND_URL}/api/v1/anime/info/${animeId}`,
    };
    axios(animeInfoOptions)
      .then((response) => {
        const {
          data: { payload },
        } = response;
        setAnimeInfo(payload);
      })
      .catch((error) => {
        toast({
          title: "Error fetching data",
          description: "Please try again later.",
        });
      })
      .finally(() => {
        setIsLoadingAnimeInfo(false);
      });

    const savedInfoOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      url: `${BACKEND_URL}/api/v1/anime/saved/${animeId}`,
    };
    axios(savedInfoOptions)
      .then((response) => {
        const {
          data: { payload },
        } = response;
        setIsSaved(Boolean(payload));
      })
      .catch((error) => {
        toast({
          title: "Error fetching data",
          description: "Please try again later.",
        });
      })
      .finally(() => {
        setIsLoadingSavedInfo(false);
      });

    const streamingLinkOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      url: `${BACKEND_URL}/api/v1/anime/streamlinks/${animeId}`,
    };
    axios(streamingLinkOptions)
      .then((response) => {
        const {
          data: {
            payload: { episodes },
          },
        } = response;
        setStreamingLinks(episodes);
      })
      .catch((error) => {
        toast({
          title: "Error fetching data",
          description: "Please try again later.",
        });
      })
      .finally(() => {
        setIsLoadingEpisodes(false);
      });
  }, [animeId, toast]);

  const examplesLength = 8;
  const exampleArray = Array.from({ length: examplesLength }, (_, i) => i);

  const downloadRange = () => {
    setIsLoadingDownload(true);
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      url: `${BACKEND_URL}/api/v1/anime/downloadlinks/range`,
      params: {
        episode_range: range,
      },
      data: streamingLinks,
    };

    toast({
      title: "Download request",
      description: `Episodes ${range}.`,
    });

    axios(options)
      .then((response) => {
        const {
          data: {
            payload: { episodes },
          },
        } = response;

        episodes.forEach((episode: any) => {
          const { title, link, episodeId } = episode;

          dispatch(
            addToQueue({
              id: uuidv4(),
              fileUrl: link,
              fileName: `${animeId} - Episode ${episodeId}.mp4`,
              date: new Date().toISOString(),
              anime: animeId,
              isReady: false,
              episodeId,
              title,
              imageSrc,
              progress: 0,
            })
          );
        });

        toast({
          title: `Adding to download queue`,
          description: `Episodes ${range}.`,
        });
      })
      .catch((error) => {
        toast({
          title: "Error downloading range",
          description: "Please try again later.",
        });
      })
      .finally(() => {
        setIsLoadingDownload(false);
      });
  };

  const saveAnime = () => {
    setIsLoadingSavingAnime(true);
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
        week_day: weekDay,
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
          description: "Please try again later.",
        });
      })
      .finally(() => {
        setIsLoadingSavingAnime(false);
      });
  };

  const unsaveAnime = () => {
    setIsLoadingSavingAnime(true);
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
          description: "Please try again later.",
        });
      })
      .finally(() => {
        setIsLoadingSavingAnime(false);
      });
  };

  return (
    <>
      <Header></Header>
      <main className="flex justify-center">
        <div className="grid grid-cols-4 py-10 space-x-24 px-12">
          {isLoadingAnimeInfo || isLoadingSavedInfo ? (
            <div className="flex flex-col space-y-4 text-center">
              <Skeleton className="w-[300px] h-[427px]"></Skeleton>
              <Skeleton className="w-[300px] h-[50px]"></Skeleton>
              <div className="pt-1">
                <Skeleton className="w-[300px] h-[30px]"></Skeleton>
                <Skeleton className="w-[300px] h-[80px] mt-4"></Skeleton>
              </div>
            </div>
          ) : (
            <div className="relative hover:cursor-pointer flex flex-col  text-center">
              <Image
                src={imageSrc}
                alt={""}
                width={300}
                height={300}
                className="rounded-md self-center"
              ></Image>
              <div
                className="absolute top-0 end-5 pt-[0.3rem] px-[0.2rem] m-1 rounded-md bg-[#020817]/80 hover:cursor-pointer mt-2"
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
                    {isLoadingSavingAnime ? (
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
              <div className="rounded-md bg-accent w-full mt-4">
                <TypographyH3 className="text-center py-3">
                  {finished ? "Finalizado" : "En emisión"}
                </TypographyH3>
              </div>
              <div className="px-2 pt-1 mt-6">
                <TypographyH4>{name}</TypographyH4>
                <TypographySmall className="text-start">
                  {description}
                </TypographySmall>
              </div>
            </div>
          )}
          <div className="col-span-3 h-[500px]">
            <div className="flex justify-between items-center pt-2 pb-4 pl-6 pr-4">
              <TypographyH3>Episodes</TypographyH3>
              <div className="flex space-x-4">
                <Input
                  placeholder="1-5,7,8-10,12"
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                />
                <Button
                  size="default"
                  variant="secondary"
                  disabled={
                    isLoadingAnimeInfo ||
                    isLoadingSavedInfo ||
                    !range ||
                    isLoadingDownload ||
                    isLoadingEpisodes
                  }
                  onClick={downloadRange}
                >
                  {isLoadingDownload && (
                    <Icons.spinner className="mr-2 h-6 w-6 animate-spin" />
                  )}
                  <TypographyH5 className="font-normal">Download</TypographyH5>
                </Button>
              </div>
            </div>
            <Separator></Separator>
            {isLoadingEpisodes ? (
              <ScrollArea className="h-[70vh] border rounded-md mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Id</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
                {exampleArray.map((ex, idx) => {
                  return (
                    <div key={idx} className="mb-4 mt-4 flex justify-center">
                      <Skeleton className="w-[98%] px-4 h-[30px]"></Skeleton>
                    </div>
                  );
                })}
              </ScrollArea>
            ) : (
              <ScrollArea className="h-[70vh] border rounded-md mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Id</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {streamingLinks.map((episode) => {
                      const { title, link, episodeId } = episode;
                      return (
                        <EpisodeInfo
                          key={episodeId}
                          episodeId={episodeId}
                          title={title}
                          anime={animeId}
                          imageSrc={imageSrc}
                          streamingLink={link}
                        ></EpisodeInfo>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
