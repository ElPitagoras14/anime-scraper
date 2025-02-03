"use client";

import { Button } from "@/components/ui/button";
import { CustomColumnDef, DataTable } from "@/components/ui/data-table";
import {
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  Drawer,
} from "@/components/ui/drawer";
import {
  SortingState,
  PaginationState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { AnimeInfo } from "./columns";

interface DrawerTableProps {
  columns: CustomColumnDef<AnimeInfo>[];
  data: AnimeInfo[];
}

export default function DrawerTable({ columns, data }: DrawerTableProps) {
  return (
    <Drawer>
      <DrawerTrigger disabled={data.length === 0}>
        <Button variant="destructive" size="sm" disabled={data.length === 0}>
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
        <DataTable columns={columns} data={data}></DataTable>
      </DrawerContent>
    </Drawer>
  );
}
