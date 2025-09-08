"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { memo } from "react";
import { Icons } from "@/components/ui/icons";
import { EllipsisIcon } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { EpisodeDownload } from "@/lib/interfaces";

interface DownloadDropdownProps {
  original: EpisodeDownload;
  role: string;
  handleForceDownload: (
    animeId: string,
    episodeNumber: number
  ) => Promise<void>;
  handleDeleteDownload: (
    animeId: string,
    episodeNumber: number
  ) => Promise<void>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const DownloadDropdownComponent = ({
  original,
  role,
  handleForceDownload,
  handleDeleteDownload,
  isOpen,
  onOpenChange,
}: DownloadDropdownProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleForceDownloadClick = async () => {
    setIsLoading(true);
    await handleForceDownload(original.animeId, original.episodeNumber);
    setIsLoading(false);
    onOpenChange(false);
  };

  const handleDeleteDownloadClick = async () => {
    setIsLoading(true);
    await handleDeleteDownload(original.animeId, original.episodeNumber);
    setIsLoading(false);
    onOpenChange(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Icons.spinner className="animate-spin h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link
              href={`/anime/${original.animeId}`}
              className="w-full cursor-pointer"
            >
              Go to anime
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            disabled={role !== "admin" && role !== "member"}
            onClick={handleForceDownloadClick}
          >
            Force re download
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            disabled={role !== "admin" && role !== "member"}
            onClick={handleDeleteDownloadClick}
          >
            Delete download
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const DownloadDropdown = memo(DownloadDropdownComponent);
