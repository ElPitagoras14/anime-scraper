"use client";

import { Button } from "@/components/ui/button";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  Drawer,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { TypographyH4, TypographyH6 } from "@/components/ui/typography";
import { setMaxConcurrentDownloads } from "@/redux/features/downloadSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { YAxis, XAxis, Bar, BarChart } from "recharts";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/utils/utils";
import {
  ColumnDef,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { Icons } from "@/components/ui/icons";
import { IconTrash } from "@tabler/icons-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QueryParams } from "@/utils/interfaces";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface AnimeInfo {
  id: string;
  name: string;
  size: number;
}

const getCachedData = async (
  token: string,
  params: QueryParams = {
    sorting: [],
    pagination: {
      pageIndex: 0,
      pageSize: 10,
    },
  }
) => {
  const {
    sorting: [{ id = undefined, desc = undefined } = {}] = [],
    pagination: { pageIndex, pageSize } = {},
  } = params;
  const chartOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: `${BACKEND_URL}/api/v2/animes/cache`,
    params: {
      sort_by: id,
      desc: desc,
      page: pageIndex,
      size: pageSize,
    },
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

export default function AppTab() {
  const { data } = useSession();
  const { user: { token = "", isAdmin = true } = {} } = data || {};
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const { maxConcurrentDownloads } = useAppSelector(
    (state: { downloadReducer: any }) => state.downloadReducer
  );
  const dispatch = useAppDispatch();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [chartInfo, setChartInfo] = useState<any>({});
  const { items = [], size = "", measuredIn = "" } = chartInfo || {};

  const [cacheView, setCacheView] = useState<any>({});
  const { items: cacheItems = [], total = 0 } = cacheView || {};
  const cacheData = cacheItems.map((item: any) => {
    const { animeId, name, size } = item;
    return {
      id: animeId,
      name,
      size,
    };
  });

  const chartData = items.map((item: any) => {
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

  const chartColumns: ColumnDef<AnimeInfo>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
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
      cell: ({
        row: {
          original: { id },
        },
      }) => {
        return (
          <LoadableIcon
            Icon={IconTrash}
            func={() => handleDeleteAnime(id)}
          ></LoadableIcon>
        );
      },
    },
  ];

  useEffect(() => {
    (async () => {
      const cachedData = await getCachedData(token, {
        pagination: {
          pageSize: -1,
        },
      });
      setChartInfo(cachedData);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      const cachedData = await getCachedData(token, {
        pagination,
        sorting,
      });
      setCacheView(cachedData);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting, pagination]);

  const handleDeleteAnime = async (animeId: string) => {
    try {
      await deleteAnime(animeId, token);
      const cachedData = await getCachedData(token, {
        pagination: {
          pageSize: -1,
        },
      });
      setChartInfo(cachedData);
      const cacheView = await getCachedData(token, {
        pagination: {
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
        },
      });
      setCacheView(cacheView);
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

  return (
    <div className="my-6 space-y-6">
      <div className="mx-6 grid grid-cols-2 items-center gap-x-6">
        <div className="space-y-1 md:space-y-3">
          <TypographyH4>Max Concurrent Downloads</TypographyH4>
          <p className="text-xs md:text-base text-muted-foreground">
            Set the maximum number of concurrent downloads
          </p>
        </div>
        <Input
          className="w-[60%] justify-self-end"
          placeholder="Max concurrent downloads"
          value={maxConcurrentDownloads || 1}
          onChange={(e) => {
            const { target: { value } = {} } = e;
            if (value === "") {
              dispatch(setMaxConcurrentDownloads(1));
            }
            dispatch(setMaxConcurrentDownloads(parseInt(e.target.value)));
          }}
          required
        ></Input>
      </div>
      {isAdmin && (
        <>
          <Separator></Separator>
          <div className="mx-6 items-center space-y-6 ">
            <div className="flex flex-col md:flex-row justify-between md:items-center">
              <div className="space-y-1 md:space-y-2">
                <TypographyH4>Manage Cache ({measuredIn})</TypographyH4>
                <p className="text-xs md:text-base text-muted-foreground">
                  Clear the cache to free up space
                </p>
              </div>
              <div className="flex items-center justify-between md:justify-normal space-x-4">
                <TypographyH6>
                  Total data: {size}
                  {measuredIn}
                </TypographyH6>
                {isMobile ? (
                  <Drawer>
                    <DrawerTrigger>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={size === 0}
                      >
                        Clear Cache
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className="px-8 pb-6">
                      <DrawerHeader className="text-left">
                        <DrawerTitle>Clear Cache</DrawerTitle>
                        <DrawerDescription>
                          Select the data you want to clean
                        </DrawerDescription>
                      </DrawerHeader>
                      <DataTable
                        columns={chartColumns}
                        data={cacheData}
                        serverSide={{
                          totalRows: total,
                          setServerSort: setSorting,
                          setServerPage: setPagination,
                        }}
                      ></DataTable>
                    </DrawerContent>
                  </Drawer>
                ) : (
                  <Dialog>
                    <DialogTrigger disabled={size === 0}>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={size === 0}
                      >
                        Clear Cache
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="min-w-[70%] max-h-[90%]">
                      <DialogHeader>
                        <DialogTitle>Clean Data</DialogTitle>
                        <DialogDescription>
                          Select the data you want to clean
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="h-[70vh]">
                        <DataTable
                          columns={chartColumns}
                          data={cacheData}
                          serverSide={{
                            totalRows: total,
                            setServerSort: setSorting,
                            setServerPage: setPagination,
                          }}
                        ></DataTable>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
            <ChartContainer
              config={chartConfig}
              className="w-full max-h-screen"
            >
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
                    return `${value} ${measuredIn}`;
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
        </>
      )}
    </div>
  );
}

const LoadableIcon = ({
  Icon,
  func,
}: {
  Icon: React.ElementType;
  func: () => Promise<void>;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Icons.spinner className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <Icon
        className="cursor-pointer hover:text-primary h-5 w-5"
        onClick={async () => {
          setIsLoading(true);
          await func();
          setIsLoading(false);
        }}
      ></Icon>
    </div>
  );
};
