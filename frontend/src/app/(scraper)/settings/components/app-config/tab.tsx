"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TypographyH4, TypographyH6 } from "@/components/ui/typography";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { YAxis, XAxis, Bar, BarChart } from "recharts";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import { getQueryParamsOptions, useIsMobile } from "@/utils/utils";
import { PaginationState, SortingState } from "@tanstack/react-table";
import DrawerTable from "./drawer-table";
import { AnimeInfo, columns } from "./columns";
import { CustomColumnDef } from "@/components/ui/data-table";
import { IconTrash } from "@tabler/icons-react";
import LoadableIcon from "./loadable-icon";
import DialogTable from "./dialog-table";
import { QueryParams } from "@/utils/interfaces";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const getCacheData = async (token: string, params: QueryParams) => {
  const chartOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: `${BACKEND_URL}/api/v2/animes/cache`,
    params: getQueryParamsOptions(params),
  };

  const response = await axios(chartOptions);
  const {
    data: { payload },
  } = response;
  return payload;
};

const deleteAnime = async (animeId: string, token: string) => {
  const options = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: `${BACKEND_URL}/api/v2/animes/cache/${animeId}`,
  };

  await axios(options);
};

interface AnimeInfoResponse {
  items: any[];
  size: string;
  measuredIn: string;
  total: number;
}

export default function AppTab() {
  const { data: session } = useSession();
  const { user: { token = "", isAdmin = true } = {} } = session || {};
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [data, setData] = useState<AnimeInfoResponse>({
    items: [],
    size: "",
    measuredIn: "",
    total: 0,
  });
  const [pagination, setPagination] = useState<PaginationState>({
    pageSize: -1,
    pageIndex: 0,
  });

  const { items = [], size = "", measuredIn = "" } = data || {};

  const chartData = items.slice(0, 10).map((item: any) => {
    const { animeId, name, size } = item;
    return {
      id: animeId,
      name,
      size,
    };
  });

  const chartConfig = chartData.reduce((acc: any, item: any) => {
    const { id, name } = item;
    acc[id] = {
      label: name,
    };
    return acc;
  }, {} as any) satisfies ChartConfig;

  const loadCacheData = async () => {
    const data = await getCacheData(token, {
      pagination,
    });
    setData(data);
  };

  const handleDeleteAnime = async (animeId: string) => {
    try {
      await deleteAnime(animeId, token);
      const data = await getCacheData(token, {
        pagination: {
          pageSize: -1,
        },
      });
      setData(data);
      toast({
        title: "Anime deleted",
        description: "The anime was successfully deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the anime",
      });
    }
  };

  const newColumns: CustomColumnDef<AnimeInfo>[] = [
    ...columns,
    {
      accessorKey: "size",
      header: () => {
        return <div className="text-center">Size</div>;
      },
      cell: ({ row }) => {
        const { size } = row.original;
        return (
          <div className="text-right w-[80%]">
            {size.toFixed(2)} {measuredIn}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => {
        return <div className="text-center">Actions</div>;
      },
      cell: ({ row }) => {
        const {
          original: { animeId },
        } = row;
        return (
          <LoadableIcon
            Icon={IconTrash}
            func={() => handleDeleteAnime(animeId)}
          ></LoadableIcon>
        );
      },
    },
  ];

  useEffect(() => {
    if (!token) return;
    (async () => {
      await loadCacheData();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="my-6 space-y-6">
      <div className="mx-6 items-center space-y-6 ">
        <div className="flex flex-col md:flex-row justify-between md:items-center">
          <div className="space-y-1 md:space-y-2">
            <TypographyH4>Manage Cache ({measuredIn})</TypographyH4>
            <p className="text-xs md:text-base text-muted-foreground">
              Clear the cache to free up space
            </p>
          </div>
          <div className="flex items-center justify-between md:justify-normal space-x-4">
            <TypographyH6>Total data: {size}</TypographyH6>
            {isMobile ? (
              <DrawerTable columns={newColumns} data={data.items} />
            ) : (
              <DialogTable columns={newColumns} data={data.items} />
            )}
          </div>
        </div>
        <ChartContainer config={chartConfig} className="w-full max-h-screen">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 10,
            }}
          >
            <YAxis
              dataKey="id"
              type="category"
              tickLine={true}
              tickMargin={5}
              axisLine={false}
              minTickGap={0}
              tickFormatter={(value: keyof typeof chartConfig) => {
                return chartConfig[value]?.label.slice(0, 20);
              }}
            ></YAxis>
            <XAxis
              dataKey="size"
              type="number"
              tickFormatter={(value: number) => {
                return `${value}`;
              }}
            ></XAxis>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent nameKey="name" indicator="dashed" />
              }
            />
            <Bar
              dataKey="size"
              layout="vertical"
              radius={4}
              fill="hsl(var(--primary))"
            ></Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
