"use client";

import { EpisodeInfo } from "@/components/episode-info";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  Table,
} from "@/components/ui/table";
import { TypographyH3, TypographyH5 } from "@/components/ui/typography";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface AnimeEpisodesProps {
  animeId: string;
  image: string;
}

const getStreamingLinks = async (token: string, animeId: string) => {
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

  return items;
};

const addDownloadRange = async (
  token: string,
  range: string,
  streamingLinks: any
) => {
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

  await axios(downloadRangeOptions);
};

export default function AnimeEpisodes({ animeId, image }: AnimeEpisodesProps) {
  const { data } = useSession();
  const { user: { token = "" } = {} } = data || {};
  const { toast } = useToast();
  const [streamingLinks, setStreamingLinks] = useState([]);
  const [range, setRange] = useState("");
  const [isLoadingDownload, setIsLoadingDownload] = useState(false);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoadingEpisodes(true);
      try {
        const items = await getStreamingLinks(token, animeId);
        setStreamingLinks(items);
      } catch (error: any) {
        if (!error.response) {
          toast({
            title: "Error fetching episodes",
            description: "Please try again later.",
          });
        }

        const { response: { status = 500 } = {} } = error;

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
      await addDownloadRange(token, range, streamingLinks);
      toast({
        title: `Adding to download queue ${range}`,
      });
    } catch (error: any) {
      if (!error.response) {
        toast({
          variant: "destructive",
          title: "Error downloading range",
          description: "Please try again later.",
        });
      }

      const { response: { status = 500 } = {} } = error;

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

  const examplesLength = 8;
  const exampleArray = Array.from({ length: examplesLength }, (_, i) => i);

  return (
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
            disabled={!range || isLoadingDownload || isLoadingEpisodes}
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
                const { name, link, episodeId, id } = episode;
                return (
                  <EpisodeInfo
                    key={episodeId}
                    id={id}
                    episodeId={episodeId}
                    name={name}
                    streamingLink={link}
                  ></EpisodeInfo>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </div>
  );
}
