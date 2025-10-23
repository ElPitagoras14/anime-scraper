"use client";

import AnimeCard, { AnimeInfo } from "@/components/anime-card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowUpNarrowWideIcon, ArrowDownNarrowWideIcon } from "lucide-react";
import { useState } from "react";

interface SavedContainerProps {
  items: AnimeInfo[];
}

export default function SavedContainer({ items }: SavedContainerProps) {
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const sortedItems = items.sort((a, b) => {
    const idA = a.id;
    const idB = b.id;

    if (sortBy === "name") {
      if (sortOrder === "asc") {
        return idA.localeCompare(idB);
      } else {
        return idB.localeCompare(idA);
      }
    } else if (sortBy === "save-date") {
      if (sortOrder === "asc") {
        return new Date(a.saveDate).getTime() - new Date(b.saveDate).getTime();
      } else {
        return new Date(b.saveDate).getTime() - new Date(a.saveDate).getTime();
      }
    }
    return 0;
  });

  return (
    <div className="flex flex-col gap-y-8">
      <div className="flex flex-row gap-x-4 items-center">
        <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select a sort option" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sort by</SelectLabel>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="save-date">Save date</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {sortOrder === "asc" ? (
          <Tooltip>
            <TooltipTrigger type="button">
              <ArrowUpNarrowWideIcon
                className="w-6 h-6 cursor-pointer hover:text-indigo-500"
                onClick={() => setSortOrder("desc")}
              />
            </TooltipTrigger>
            <TooltipContent>Sort in descending order</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger type="button">
              <ArrowDownNarrowWideIcon
                className="w-6 h-6 cursor-pointer hover:text-indigo-500"
                onClick={() => setSortOrder("asc")}
              />
            </TooltipTrigger>
            <TooltipContent>Sort in ascending order</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex flex-row flex-wrap gap-x-9 gap-y-4">
        {sortedItems.map((item: AnimeInfo) => (
          <AnimeCard key={item.id} animeInfo={item} />
        ))}
      </div>
    </div>
  );
}
