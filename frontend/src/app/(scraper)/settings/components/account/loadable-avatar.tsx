"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/ui/icons";
import { useState } from "react";

interface LoadableAvatarProps {
  avatar: string;
  func: () => Promise<void>;
}

export default function LoadableAvatar({
  avatar = "",
  func,
}: LoadableAvatarProps) {
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
      <Avatar
        className="h-20 md:h-24 w-20 md:w-24 bg-primary-foreground p-3 hover:bg-primary hover:cursor-pointer"
        onClick={async () => {
          setIsLoading(true);
          await func();
          setIsLoading(false);
        }}
      >
        <AvatarImage src={avatar}></AvatarImage>
        <AvatarFallback>JG</AvatarFallback>
      </Avatar>
    </div>
  );
}
