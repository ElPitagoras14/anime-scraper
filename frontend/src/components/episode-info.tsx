"use client";

import { TableCell, TableRow } from "./ui/table";
import { Download, Play } from "lucide-react";
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
  id: number;
  streamingLink: string;
  episodeId: number;
  name: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const downloadSingleEpisode = async (
  token: string,
  id: number,
  streamingLink: string
) => {
  const downloadOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: `${BACKEND_URL}/api/v2/animes/downloadlinks/single`,
    params: {
      id,
      episode_link: streamingLink,
    },
  };

  const response = await axios(downloadOptions);
  const {
    data: { statusCode },
  } = response;
  return statusCode;
};

export const EpisodeInfo = ({
  id,
  streamingLink,
  episodeId,
  name,
}: EpisodeInfoProps) => {
  const { data } = useSession();
  const { user: { token = "" } = {} } = data || {};
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const getDownloadLink = async () => {
    try {
      setIsLoading(true);

      const statusCode = await downloadSingleEpisode(token, id, streamingLink);

      if (statusCode === 201) {
        toast({
          title: `Download already in queue. Episode ${episodeId}`,
        });
        return;
      }

      toast({
        title: `Adding to download queue. Episode ${episodeId}`,
      });
    } catch (error: any) {
      if (!error.response) {
        toast({
          variant: "destructive",
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
