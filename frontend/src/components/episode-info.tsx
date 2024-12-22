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
import { signOut, useSession } from "next-auth/react";

interface EpisodeInfoProps {
  anime: string;
  streamingLink: string;
  episodeId: number;
  name: string;
  image: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const EpisodeInfo = ({
  anime,
  streamingLink,
  episodeId,
  name,
  image,
}: EpisodeInfoProps) => {
  const { data } = useSession();
  const { user: { token = "" } = {} } = data || {};
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const startDownload = (downloadInfo: { link: string; service: string }) => {
    const { link, service } = downloadInfo;
    dispatch(
      addToQueue({
        id: uuidv4(),
        isReady: false,
        link,
        service,
        fileName: `${anime} - Episode ${episodeId}.mp4`,
        date: new Date().toISOString(),
        anime,
        episodeId,
        name,
        image,
        progress: 0,
      })
    );
  };

  const getDownloadLink = async () => {
    setIsLoading(true);
    try {
      const downloadOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        url: `${BACKEND_URL}/api/v2/animes/downloadlinks/single`,
        params: {
          episode_id: episodeId,
          episode_link: streamingLink,
        },
      };

      toast({
        title: "Download request.",
        description: `Episode ${episodeId}`,
      });

      const response = await axios(downloadOptions);
      const {
        data: {
          payload: { downloadInfo: { link = "", service = "" } = {} },
        },
      } = response;

      if (!link) {
        toast({
          title: "Error fetching download link",
          description: `Episode ${episodeId}`,
        });
        return;
      }

      toast({
        title: `Adding to download queue.`,
        description: `Episode ${episodeId}`,
      });

      startDownload({ link, service });
    } catch (error: any) {
      if (!error.response) {
        toast({
          title: "Error fetching download link",
          description: `Episode ${episodeId}`,
        });
      }

      const { response: { status = 500 } = {} } = error;

      if (status === 500) {
        toast({
          title: "Server error",
          description: "Please try again later",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openStreamingLink = () => {
    window.open(streamingLink, "_blank");
  };

  return (
    <TableRow>
      <TableCell>{episodeId}</TableCell>
      <TableCell>{name}</TableCell>
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
