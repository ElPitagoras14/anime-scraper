"use client";

import { TypographyH2, TypographySmall } from "@/components/ui/typography";
import { CustomColumnDef, DataTable } from "@/components/ui/data-table";
import { useEffect, useState } from "react";
import { AnimeToDownload } from "./components/columns";
import axios from "axios";
import { useSession } from "next-auth/react";
import { columns } from "./components/columns";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import ProgressBar from "@/components/ui/progress-bar";
import { Download, MoreHorizontal } from "lucide-react";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QueryParams } from "@/utils/interfaces";
import { getQueryParamsOptions } from "@/utils/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface AnimeToDownloadResponse {
  items: AnimeToDownload[];
  total: number;
}

const getData = async (token: string, userId: string, params: QueryParams) => {
  const dataOptions = {
    url: `${BACKEND_URL}/api/v2/animes/episodes/user/${userId}`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    params: getQueryParamsOptions(params),
  };

  const response = await axios.request(dataOptions);
  const {
    data: { payload },
  } = response;

  return payload;
};

const forceReDownload = async (token: string, id: number) => {
  const downloadOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: `${BACKEND_URL}/api/v2/animes/downloadlinks/force`,
    params: {
      episode_id: id,
    },
  };

  const response = await axios(downloadOptions);
  const {
    data: { statusCode },
  } = response;
  return statusCode;
};

const deleteDownload = async (token: string, id: number, userId: string) => {
  const deleteOptions = {
    method: "DELETE",
    url: `${BACKEND_URL}/api/v2/animes/episodes/user/${userId}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    params: {
      episode_id: id,
    },
  };

  await axios.request(deleteOptions);
};

export default function Downloads() {
  const { data: session } = useSession();
  const { user: { token = "", id = "" } = {} } = session || {};
  const { toast } = useToast();

  const [data, setData] = useState<AnimeToDownloadResponse>({
    items: [],
    total: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const handleReDownload = async (episodeId: number) => {
    try {
      await forceReDownload(token, episodeId);
      await loadData();
      toast({
        title: "Re-download request sent",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error re-downloading episode",
        description: "Please try again later",
      });
    }
  };

  const handleDeleteDownload = async (episodeId: number) => {
    try {
      await deleteDownload(token, episodeId, id);
      await loadData();
      toast({
        title: "Download deleted",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting download",
        description: "Please try again later",
      });
    }
  };

  const statusColumn = columns.find(
    (column) => column.accessorKey === "status"
  );
  if (statusColumn) {
    statusColumn.cell = ({
      row: {
        original: { status, progress, episodeId, filename },
      },
    }) => {
      if (status === "DOWNLOADING") {
        return (
          <div className="flex flex-row space-x-2 w-40 lg:w-80">
            <ProgressBar value={progress} />
            <span>{progress.toFixed(2)}%</span>
          </div>
        );
      }

      if (status === "DOWNLOADED") {
        return (
          <div className="flex flex-row justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (!token) {
                  toast({
                    variant: "destructive",
                    title: "Unauthorized",
                    description: "Please login to download",
                  });
                }
                window.location.href = `${BACKEND_URL}/api/v2/animes/episodes/download/${episodeId}?token=${token}`;
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );
      }

      return <div className="text-center">{status}</div>;
    };
  }

  const newColumns: CustomColumnDef<AnimeToDownload>[] = [
    ...columns,
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const {
          original: { episodeId, status },
        } = row;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={async () => await handleReDownload(episodeId)}
                disabled={status === "DOWNLOADING"}
              >
                Force re download
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => await handleDeleteDownload(episodeId)}
                disabled={status !== "DOWNLOADED"}
              >
                Delete download
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const loadData = async () => {
    try {
      setIsLoading(true);
      const payload = await getData(token, id, {
        pagination,
        sorting,
      });
      setData(payload);
    } catch (error: any) {
      setData({ items: [], total: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    (async () => {
      await loadData();
    })();
  }, [token, pagination, sorting]);

  return (
    <main className="flex flex-col items-center py-6 lg:py-10 space-y-4">
      <div className="lg:w-[70%] w-[90%] space-y-2">
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-col">
            <TypographyH2 className="pb-0">Downloads</TypographyH2>
            <TypographySmall className="text-muted-foreground">
              Progress update each 5 seconds
            </TypographySmall>
          </div>
          <Button variant="secondary" onClick={async () => await loadData()}>
            Refresh
          </Button>
        </div>
        <DataTable
          columns={newColumns}
          data={data.items}
          serverSide={{
            totalRows: data.total,
            isLoading,
            setServerSorting: setSorting,
            setServerPagination: setPagination,
          }}
        ></DataTable>
      </div>
    </main>
  );
}
