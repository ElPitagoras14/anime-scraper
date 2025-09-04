"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { formatDateTime, formatSize } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { DownloadIcon, EllipsisIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export type EpisodeDownload = {
  id: number;
  animeId: string;
  title: string;
  episodeNumber: number;
  poster: string;
  jobId: string | null;
  size: number | null;
  status: string;
  downloadedAt: string;
  progress: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface AnimeColumnsProps {
  role: string;
}

export const getAnimeColumns = ({
  role,
}: AnimeColumnsProps): ColumnDef<EpisodeDownload>[] => [
  {
    accessorKey: "poster",
    header: () => <div className="text-center">Poster</div>,
    cell: ({
      row: {
        original: { poster, title, animeId },
      },
    }) => (
      <div className="flex justify-center">
        <Link href={`/anime/${animeId}`}>
          <Image
            src={poster}
            alt={title}
            width={100}
            height={150}
            className="rounded-md"
          />
        </Link>
      </div>
    ),
  },
  {
    accessorKey: "title",
    header: "Anime",
    cell: ({
      row: {
        original: { title },
      },
    }) => <div className="text-base font-semibold">{title}</div>,
  },
  {
    accessorKey: "episodeNumber",
    header: () => <div className="text-center">Episode</div>,
    cell: ({
      row: {
        original: { episodeNumber },
      },
    }) => <div className="text-center">{episodeNumber}</div>,
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center">Status</div>,
    cell: ({
      row: {
        original: { status, progress, id },
      },
    }) => {
      if (
        status === "PENDING" ||
        status === "GETTING-LINK" ||
        status === "GETTING-FILE-LINK"
      ) {
        return (
          <div className="flex justify-center">
            <div className="text-center w-70">{status}</div>
          </div>
        );
      }
      if (status === "DOWNLOADING" && progress) {
        return (
          <div className="flex justify-center items-center">
            <div className="w-60 flex justify-center items-center gap-x-2">
              <Progress value={progress} className="w-60" />
              <span>{parseFloat(progress.toFixed(2))}%</span>
            </div>
          </div>
        );
      }
      if (status === "SUCCESS") {
        return (
          <div className="flex flex-col justify-center items-center">
            <div className="w-70" />
            <Button
              variant="ghost"
              size="icon"
              disabled={role !== "admin" && role !== "member"}
              onClick={() =>
                (window.location.href = `${API_URL}/api/animes/download/episode/${id}`)
              }
              className="cursor-pointer"
            >
              <DownloadIcon />
            </Button>
          </div>
        );
      }
      return null;
    },
  },
  {
    accessorKey: "size",
    header: () => <div className="text-center">Size</div>,
    cell: ({
      row: {
        original: { size },
      },
    }) => <div className="text-center">{formatSize(size)}</div>,
  },
  {
    accessorKey: "downloadedAt",
    header: () => <div className="text-center">Downloaded At</div>,
    cell: ({
      row: {
        original: { downloadedAt },
      },
    }) => <div className="text-center">{formatDateTime(downloadedAt)}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row: { original } }) => (
      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <EllipsisIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <Link href={`/anime/${original.animeId}`} className="w-full">
                Go to anime
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              disabled={role !== "admin" && role !== "member"}
            >
              Force re download
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              disabled={role !== "admin" && role !== "member"}
            >
              Delete download
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];
