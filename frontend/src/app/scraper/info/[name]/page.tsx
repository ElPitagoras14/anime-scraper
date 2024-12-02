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
import { EpisodeInfo } from "@/components/pageComponents/EpisodeInfo";
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
import { signOut, useSession } from "next-auth/react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface AnimeInfo {
  name: string;
  description: string;
  image: string;
  isFinished: boolean;
  weekDay: string;
  isSaved: boolean;
}

export default function AnimeDetail({ params }: { params: { name: string } }) {
  const { data } = useSession();
  const { user: { token = "" } = {} } = data || {};
  const { name: animeId } = params;
  const [animeInfo, setAnimeInfo] = useState<AnimeInfo>({
    name: "",
    description: "",
    image: "",
    isFinished: false,
    weekDay: "",
    isSaved: false,
  });
  const { name, description, image, isFinished, weekDay, isSaved } =
    animeInfo || {};
  const imgb64 = `data:image/jpeg;base64,${image}`;
  const [streamingLinks, setStreamingLinks] = useState([]);

  const { toast } = useToast();
  const dispatch = useAppDispatch();

  const [isLoadingAnimeInfo, setIsLoadingAnimeInfo] = useState(true);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(true);
  const [isLoadingDownload, setIsLoadingDownload] = useState(false);
  const [isLoadingSaving, setIsLoadingSaving] = useState(false);

  const [range, setRange] = useState<string>("");

  useEffect(() => {
    (async () => {
      setIsLoadingAnimeInfo(true);
      setIsLoadingEpisodes(true);
      try {
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

        setAnimeInfo(animeInfoPayload);
      } catch (error: any) {
        if (!error.response) {
          toast({
            title: "Error fetching anime info",
            description: "Please try again later.",
          });
        }

        const { response: { status = 500 } = {} } = error;

        if (status === 401) {
          toast({
            title: "Unauthorized",
            description: "Please login again.",
          });
          await signOut({
            callbackUrl: "/login",
          });
        }

        if (status === 500) {
          toast({
            title: "Server error",
            description: "Please try again later.",
          });
        }
      } finally {
        setIsLoadingAnimeInfo(false);
      }

      try {
        const streamingLinkOptions = {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          url: `${BACKEND_URL}/api/v2/animes/streamlinks/${animeId}`,
        };
        const streamingLinkResponse = await axios(streamingLinkOptions);
        const {
          data: {
            payload: { items },
          },
        } = streamingLinkResponse;

        setStreamingLinks(items);
      } catch (error: any) {
        if (!error.response) {
          toast({
            title: "Error fetching episodes",
            description: "Please try again later.",
          });
        }

        const { response: { status = 500 } = {} } = error;

        if (status === 401) {
          toast({
            title: "Unauthorized",
            description: "Please login again.",
          });
          await signOut({
            callbackUrl: "/login",
          });
        }

        if (status === 500) {
          toast({
            title: "Server error",
            description: "Please try again later.",
          });
        }
      } finally {
        setIsLoadingEpisodes(false);
      }
    })();
  }, [animeId, toast, token]);

  const downloadRange = async () => {
    setIsLoadingDownload(true);
    try {
      const downloadRangeOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        url: `${BACKEND_URL}/api/v2/animes/downloadlinks/range`,
        params: {
          episode_range: range,
        },
        data: streamingLinks,
      };

      toast({
        title: "Download request",
        description: `Episodes ${range}.`,
      });

      const response = await axios(downloadRangeOptions);
      const {
        data: {
          payload: { items },
        },
      } = response;

      items.forEach((episode: any) => {
        const {
          name,
          downloadInfo: { service, link },
          episodeId,
        } = episode || {};

        dispatch(
          addToQueue({
            id: uuidv4(),
            link,
            service,
            fileName: `${animeId} - Episode ${episodeId}.mp4`,
            date: new Date().toISOString(),
            anime: animeId,
            isReady: false,
            episodeId,
            name,
            image,
            progress: 0,
          })
        );
      });

      toast({
        title: `Adding to download queue`,
        description: `Episodes ${range}.`,
      });
    } catch (error: any) {
      if (!error.response) {
        toast({
          title: "Error downloading range",
          description: "Please try again later.",
        });
      }

      const { response: { status = 500 } = {} } = error;

      if (status === 401) {
        toast({
          title: "Unauthorized",
          description: "Please login again.",
        });
        await signOut({
          callbackUrl: "/login",
        });
      }

      if (status === 500) {
        toast({
          title: "Server error",
          description: "Please try again later.",
        });
      }
    } finally {
      setIsLoadingDownload(false);
    }
  };

  const changeSavedAnime = async (isSaving: boolean) => {
    setIsLoadingSaving(true);
    try {
      const saveOptions = {
        method: isSaving ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        url: `${BACKEND_URL}/api/v2/animes/saved/${animeId}`,
      };
      await axios(saveOptions);
      toast({
        title: `${name} ${isSaving ? "added" : "removed"} to saved`,
      });

      setAnimeInfo((prev) => ({ ...prev, isSaved: isSaving }));
    } catch (error: any) {
      if (!error.response) {
        toast({
          title: `Error ${isSaving ? "saving" : "removing"} anime`,
          description: "Please try again later",
        });
      }

      const { response: { status = 500 } = {} } = error;

      if (status === 401) {
        toast({
          title: "Unauthorized",
          description: "Please login again",
        });
        await signOut({
          callbackUrl: "/login",
        });
      }

      if (status === 409) {
        toast({
          title: `${name} already ${isSaving ? "saved" : "unsaved"}`,
        });
      }

      if (status === 500) {
        toast({
          title: "Server error",
          description: "Please try again later",
        });
      }
    } finally {
      setIsLoadingSaving(false);
    }
  };

  const examplesLength = 8;
  const exampleArray = Array.from({ length: examplesLength }, (_, i) => i);

  return (
    <>
      <Header></Header>
      <main className="flex justify-center">
        <div className="flex flex-col lg:grid lg:grid-cols-4 py-10 lg:space-x-24 space-y-4 lg:space-y-0 px-6 md:px-12 min-w-[100%] lg:min-w-0">
          {isLoadingAnimeInfo ? (
            <div className="flex flex-col items-center text-center space-y-2 lg:space-y-4">
              <Skeleton className="w-[24vh] h-[36vh] lg:w-[20vw] lg:h-[30vw]"></Skeleton>
              <Skeleton className="w-[30vh] h-[6vh] lg:w-[20vw] lg:h-[3vw]"></Skeleton>
              <Skeleton className="w-[30vh] h-[2vh] lg:w-[20vw] lg:h-[2vw]"></Skeleton>
              <Skeleton className="w-[40vh] h-[16vh] lg:w-[22vw] lg:h-[20vw]"></Skeleton>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="relative w-[24vh] h-[36vh] lg:w-[20vw] lg:h-[30vw] flex justify-center">
                <Image
                  src={imgb64}
                  alt=""
                  layout="fill"
                  className="rounded-md object-cover"
                />
                <div
                  className="absolute top-0 end-1 pt-[0.3rem] px-[0.2rem] m-1 rounded-md bg-[#020817]/80 hover:cursor-pointer mt-2"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await changeSavedAnime(!isSaved);
                  }}
                >
                  <TooltipProvider>
                    <Tooltip>
                      {isLoadingSaving ? (
                        <Icons.spinner className="h-6 w-6 mb-1 animate-spin hover:cursor-pointer" />
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
              </div>
              <div className="rounded-md bg-accent w-3/6 lg:w-full mt-4">
                <TypographyH3 className="text-center py-3">
                  {isFinished ? "Finished" : `New episode every ${weekDay}`}
                </TypographyH3>
              </div>
              <div className="px-2 pt-1 mt-3 lg:mt-6">
                <TypographyH4>{name}</TypographyH4>
                <TypographySmall className="text-start">
                  {description}
                </TypographySmall>
              </div>
            </div>
          )}
          <div className="col-span-3">
            <div className="flex justify-between items-center pt-2 pb-4 pl-2 lg:pl-6 pr-2 lg:pr-4">
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
              <ScrollArea className="h-[50vh] lg:h-[70vh] border rounded-md mt-4">
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
              <ScrollArea className="h-[50vh] lg:h-[70vh] border rounded-md mt-4">
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
                      const { name, link, episodeId } = episode;
                      return (
                        <EpisodeInfo
                          key={episodeId}
                          episodeId={episodeId}
                          name={name}
                          anime={animeId}
                          image={image}
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
