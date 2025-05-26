"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import ChangePassword from "./components/change-password";
import { PencilIcon, SquareCheckIcon, SquareXIcon } from "lucide-react";
import ChangeAvatar from "./components/change-avatar";
import { useState } from "react";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Profile() {
  const [editUsername, setEditUsername] = useState<boolean>(false);
  return (
    <div className="flex flex-colitems-center justify-center">
      <div className="w-[65%] flex flex-col gap-y-6">
        <span className="text-3xl font-semibold">Profile</span>
        <div className="flex flex-row items-center gap-x-10">
          <div className="w-40 h-40 relative rounded-full bg-muted/20">
            <Image
              src={"https://i.ibb.co/kVN40QY0/magician.png"}
              alt={""}
              fill
              className="p-6"
            />
          </div>
          <ChangeAvatar />
        </div>
        <div className="flex flex-col gap-y-4">
          <Label htmlFor="username">Username</Label>
          <div className="flex gap-x-4 items-center">
            <Input
              id="username"
              placeholder="Username"
              type="text"
              className="w-64"
            />
            {!editUsername ? (
              <Tooltip>
                <TooltipTrigger>
                  <PencilIcon
                    className="w-6 h-6 cursor-pointer"
                    onClick={() => setEditUsername(true)}
                  />
                </TooltipTrigger>
                <TooltipContent>Edit username</TooltipContent>
              </Tooltip>
            ) : (
              <React.Fragment>
                <SquareXIcon
                  className="w-7 h-7 cursor-pointer text-red-500 dark:text-red-400"
                  onClick={() => setEditUsername(false)}
                />
                <SquareCheckIcon
                  className="w-7 h-7 cursor-pointer text-green-500 dark:text-green-400"
                  onClick={() => setEditUsername(false)}
                />
              </React.Fragment>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <Label htmlFor="password">Password</Label>
          <div className="flex">
            <ChangePassword />
          </div>
        </div>
      </div>
    </div>
  );
}
