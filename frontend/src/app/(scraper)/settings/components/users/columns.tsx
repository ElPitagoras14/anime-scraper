import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CustomColumnDef } from "@/components/ui/data-table";
import DataTableHeader from "@/components/ui/data-table-header";
import { IconCircleCheck, IconCircleX } from "@tabler/icons-react";

export interface User {
  id: string;
  username: string;
  avatar: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const columns: CustomColumnDef<User>[] = [
  {
    accessorKey: "avatar",
    header: () => {
      return <div className="text-center">Avatar</div>;
    },
    cell: ({
      row: {
        original: { avatar },
      },
    }) => {
      const path = `/avatars/${avatar}`;
      return (
        <div className="flex justify-center">
          <Avatar className="h-12 w-12">
            <AvatarImage src={path} />
            <AvatarFallback>JG</AvatarFallback>
          </Avatar>
        </div>
      );
    },
  },
  {
    accessorKey: "username",
    label: "Username",
    header: ({ column }) => (
      <DataTableHeader column={column} title={"Username"} />
    ),
    cell: ({
      row: {
        original: { username },
      },
    }) => {
      return <div className="text-center">{username}</div>;
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "isAdmin",
    header: () => {
      return <div className="text-center">Is Admin</div>;
    },
    cell: ({
      row: {
        original: { isAdmin },
      },
    }) => {
      return (
        <div className="flex justify-center">
          {isAdmin ? (
            <IconCircleCheck className="h-8 w-8 text-green-500" />
          ) : (
            <IconCircleX className="h-8 w-8 text-red-500" />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: () => {
      return <div className="text-center">Is Active</div>;
    },
    cell: ({
      row: {
        original: { isActive },
      },
    }) => {
      return (
        <div className="flex justify-center">
          {isActive ? (
            <IconCircleCheck className="h-8 w-8 text-green-500" />
          ) : (
            <IconCircleX className="h-8 w-8 text-red-500" />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableHeader column={column} title={"Member Since"} />
    ),
    cell: ({
      row: {
        original: { createdAt },
      },
    }) => {
      return (
        <div className="text-center">
          {new Date(createdAt).toLocaleString("es-ES", {
            hour12: false,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableHeader column={column} title={"Last Update"} />
    ),
    cell: ({
      row: {
        original: { updatedAt },
      },
    }) => {
      return (
        <div className="text-center">
          {new Date(updatedAt).toLocaleString("es-ES", {
            hour12: false,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
      );
    },
  },
];
