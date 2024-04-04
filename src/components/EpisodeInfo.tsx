"use client";

import { TableCell, TableRow } from "./ui/table";
import { Download, Play } from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { addToQueue } from "@/redux/features/downloadSlice";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { useState } from "react";
import { useToast } from "./ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icons } from "./ui/icons";

interface EpisodeInfoProps {
  anime: string;
  streamingLink: string;
  episodeId: number;
  title: string;
  imageSrc: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const EpisodeInfo = ({
  anime,
  streamingLink,
  episodeId,
  title,
  imageSrc,
}: EpisodeInfoProps) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const startDownload = (fileUrl: string) => {
    dispatch(
      addToQueue({
        id: uuidv4(),
        isReady: false,
        fileUrl,
        fileName: `${anime} - Episode ${episodeId}.mp4`,
        date: new Date().toISOString(),
        anime,
        episodeId,
        title,
        imageSrc,
        progress: 0,
      })
    );
  };

  const getDownloadLink = () => {
    setIsLoading(true);

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      url: `${BACKEND_URL}/api/v1/anime/downloadlinks/single`,
      params: {
        episode_id: episodeId,
        episode_link: streamingLink,
      },
    };

    toast({
      title: "Download request.",
      description: `Episode ${episodeId}`,
    });

    axios(options)
      .then((response) => {
        const {
          data: {
            payload: { link },
          },
        } = response;
        toast({
          title: `Adding to download queue.`,
          description: `Episode ${episodeId}`,
        });
        startDownload(link);
      })
      .catch((error) => {
        toast({
          title: "Error fetching download link",
          description: `Episode ${episodeId}`,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const openStreamingLink = () => {
    window.open(streamingLink, "_blank");
  };

  return (
    <TableRow>
      <TableCell>{episodeId}</TableCell>
      <TableCell>{title}</TableCell>
      <TableCell className="flex justify-center">
        <TooltipProvider>
          {isLoading ? (
            <>
              <Icons.spinner className="mr-2 h-6 w-6 animate-spin" />
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger>
                <Download
                  className="h-6 w-6 hover:cursor-pointer"
                  onClick={getDownloadLink}
                ></Download>
              </TooltipTrigger>
              <TooltipContent>Download episode</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger>
              <Play
                className="h-6 w-6 hover:cursor-pointer ml-2"
                onClick={openStreamingLink}
              ></Play>
            </TooltipTrigger>
            <TooltipContent>See on Website</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
    </TableRow>
  );
};
