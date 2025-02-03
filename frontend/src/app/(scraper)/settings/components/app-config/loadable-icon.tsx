"use client";

import { Icons } from "@/components/ui/icons";
import { useState } from "react";

interface LoadableIconProps {
  Icon: React.ElementType;
  func: () => Promise<void>;
}

export default function LoadableIcon({ Icon, func }: LoadableIconProps) {
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
}
