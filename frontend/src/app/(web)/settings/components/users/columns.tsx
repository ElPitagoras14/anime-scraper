"use client";

import { formatDateTime } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { CircleCheckIcon, CircleXIcon } from "lucide-react";
import Image from "next/image";
import DeleteModal from "./delete-modal";

export type User = {
  id: string;
  username: string;
  avatarUrl: string | null;
  avatarLabel: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: "avatarUrl",
    header: () => <div className="text-center">Avatar</div>,
    cell: ({
      row: {
        original: { avatarUrl, avatarLabel },
      },
    }) => (
      <div className="flex justify-center">
        <div className="relative w-20 h-20 rounded-full bg-muted/20">
          {avatarUrl && (
            <Image src={avatarUrl} alt={avatarLabel!} fill className="p-3" />
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "username",
    header: () => <div className="text-center">Username</div>,
    cell: ({
      row: {
        original: { username },
      },
    }) => <div className="text-center">{username}</div>,
  },
  {
    accessorKey: "role",
    header: () => <div className="text-center">Role</div>,
    cell: ({
      row: {
        original: { role },
      },
    }) => <div className="text-center">{role}</div>,
  },
  {
    accessorKey: "isActive",
    header: () => <div className="text-center">Active</div>,
    cell: ({
      row: {
        original: { isActive },
      },
    }) => (
      <div className="flex justify-center items-center">
        {isActive ? (
          <CircleCheckIcon className="text-green-500 dark:text-green-400" />
        ) : (
          <CircleXIcon className="text-red-500 dark:text-red-400" />
        )}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: () => <div className="text-center">Member Since</div>,
    cell: ({
      row: {
        original: { createdAt },
      },
    }) => <div className="text-center">{formatDateTime(createdAt)}</div>,
  },
  {
    accessorKey: "updatedAt",
    header: () => <div className="text-center">Last Updated</div>,
    cell: ({
      row: {
        original: { updatedAt },
      },
    }) => <div className="text-center">{formatDateTime(updatedAt)}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-center">Actions</div>,
    cell: ({
      row: {
        original: { id, username },
      },
    }) => (
      <div className="flex justify-center">
        <DeleteModal userId={id} username={username} />
      </div>
    ),
  },
];
