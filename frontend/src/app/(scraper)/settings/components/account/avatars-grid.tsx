"use client";

import { useState } from "react";
import LoadableAvatar from "./loadable-avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AvatarsGridProps {
  avatars: string[];
  changeAvatar: (avatar: string) => Promise<void>;
  isMobile?: boolean;
}

export default function AvatarsGrid({
  avatars,
  changeAvatar,
  isMobile,
}: AvatarsGridProps) {
  const pageSize = isMobile ? 9 : 21;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(avatars.length / pageSize);
  const paginatedAvatars = avatars.slice(
    page * pageSize,
    (page + 1) * pageSize
  );

  return (
    <div className="flex flex-col space-y-8">
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-x-4 gap-y-8 justify-items-center">
        {paginatedAvatars.map((avatar) => {
          const path = `/avatars/${avatar}`;
          return (
            <div
              key={avatar}
              className="flex flex-col items-center justify-center space-y-4"
            >
              <LoadableAvatar
                avatar={path}
                func={async () => await changeAvatar(avatar)}
              />
            </div>
          );
        })}
      </div>
      <div className="flex flex-row justify-center space-x-4 mt-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            setPage((prev) => {
              return Math.max(0, prev - 1);
            })
          }
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            setPage((prev) => {
              return Math.min(totalPages - 1, prev + 1);
            })
          }
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
