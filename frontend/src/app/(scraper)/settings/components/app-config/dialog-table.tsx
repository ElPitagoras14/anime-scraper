"use client";

import { Button } from "@/components/ui/button";
import { CustomColumnDef, DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimeInfo } from "./columns";
import {
  SortingState,
  PaginationState,
  ColumnFiltersState,
} from "@tanstack/react-table";

interface DialogTableProps {
  columns: CustomColumnDef<AnimeInfo>[];
  data: AnimeInfo[];
}

export default function DialogTable({
  columns,
  data,
}: DialogTableProps) {
  return (
    <Dialog>
      <DialogTrigger disabled={data.length === 0}>
        <Button
          variant="destructive"
          size="sm"
          disabled={data.length === 0}
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
            columns={columns}
            data={data}
          ></DataTable>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
