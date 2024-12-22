"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Icons } from "@/components/ui/icons";
import { TypographyH5 } from "@/components/ui/typography";
import { camelToSnake, useIsMobile } from "@/utils/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { Switch } from "@radix-ui/react-switch";
import { IconCircleCheck, IconCircleX, IconEdit } from "@tabler/icons-react";
import {
  ColumnDef,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import { QueryParams } from "@/utils/interfaces";
import DataTableHeader from "@/components/ui/data-table-header";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

type CustomColumnDef<T> = ColumnDef<T> & {
  label?: string;
};

interface User {
  id: string;
  username: string;
  avatar: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const usersColumns: CustomColumnDef<User>[] = [
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
          {new Date(createdAt).toLocaleDateString()}
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
          {new Date(updatedAt).toLocaleDateString()}
        </div>
      );
    },
  },
];

const getUsersInfo = async (
  token: string,
  params: QueryParams = {
    sorting: [],
    pagination: { pageIndex: 0, pageSize: 10 },
  }
) => {
  const {
    sorting: [{ id = undefined, desc = undefined } = {}] = [],
    pagination: { pageIndex, pageSize } = {},
  } = params;
  const usersOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: `${BACKEND_URL}/api/v2/users`,
    params: {
      sort_by: camelToSnake(id),
      desc: desc,
      page: pageIndex,
      size: pageSize,
    },
  };

  const response = await axios(usersOptions);
  const {
    data: {
      payload: { items, total },
    },
  } = response;

  return { items, total };
};

const changeUserStatus = async (
  userId: string,
  isAdmin: boolean,
  isActive: boolean
) => {
  const usersOptions = {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    url: `${BACKEND_URL}/api/v2/users/${userId}`,
    data: {
      isAdmin,
      isActive,
    },
  };

  await axios(usersOptions);
};

export default function UsersTab() {
  const isMobile = useIsMobile();
  const { data } = useSession();
  const { user: { token = "", id: userId = "", isAdmin = false } = {} } =
    data || {};

  const { toast } = useToast();

  const [openModal, setOpenModal] = useState(false);
  const [userFocusId, setUserFocusId] = useState("");
  const [usersInfo, setUsersInfo] = useState<any>({ items: [], total: 0 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>();

  useEffect(() => {
    (async () => {
      const info = await getUsersInfo(token);
      setUsersInfo(info);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      const info = await getUsersInfo(token, { sorting, pagination });
      setUsersInfo(info);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting, pagination]);

  const handleChangeUserStatus = async (
    userId: string,
    isAdmin: boolean,
    isActive: boolean
  ) => {
    try {
      await changeUserStatus(userId, isAdmin, isActive);
      const info = await getUsersInfo(token);
      setUsersInfo(info);
    } catch (error: any) {
      if (!error.response) {
        toast({
          title: "Error",
          description: "An error occurred while changing the user status",
        });
      }

      const { response: { status = 500 } = {} } = error;

      if (status === 409) {
        toast({
          title: "Conflict",
          description: "The user status was not changed",
        });
      }

      if (status === 500) {
        toast({
          title: "Server error",
          description: "Please try again later",
        });
      }
    }
  };

  if (isAdmin) {
    if (!usersColumns.some((column) => column.id === "actions")) {
      usersColumns.push({
        id: "actions",
        header: () => {
          return <div className="text-center">Actions</div>;
        },
        cell: ({
          row: {
            original: { id },
          },
        }) => {
          if (id === userId) {
            return null;
          }
          return (
            <div className="flex justify-center">
              <IconEdit
                className="hover:text-primary cursor-pointer"
                onClick={() => {
                  setOpenModal(true);
                  setUserFocusId(id);
                }}
              ></IconEdit>
            </div>
          );
        },
      });
    }
  }

  return (
    <div className="my-6">
      <DataTable
        columns={usersColumns}
        data={usersInfo.items}
        serverSide={{
          totalRows: usersInfo.total,
          setServerSort: setSorting,
          setServerPage: setPagination,
        }}
      ></DataTable>
      {isMobile ? (
        <Drawer open={openModal} onOpenChange={setOpenModal}>
          <UpdateDrawer
            userId={userFocusId}
            usersInfo={usersInfo.items}
            func={handleChangeUserStatus}
          ></UpdateDrawer>
        </Drawer>
      ) : (
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <UpdateDialog
            userId={userFocusId}
            usersInfo={usersInfo.items}
            func={handleChangeUserStatus}
          ></UpdateDialog>
        </Dialog>
      )}
    </div>
  );
}

const UpdateDrawer = ({
  userId,
  usersInfo,
  func,
}: {
  userId: string;
  usersInfo: any;
  func: (userId: string, isAdmin: boolean, isActive: boolean) => Promise<void>;
}) => {
  const user = usersInfo.find((user: User) => user.id === userId);
  const { username, isAdmin = false, isActive = false } = user || {};

  const [checkIsAdmin, setCheckIsAdmin] = useState<boolean>(isAdmin);
  const [checkIsActive, setCheckIsActive] = useState<boolean>(
    Boolean(isActive)
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setCheckIsAdmin(isAdmin);
    setCheckIsActive(isActive);
  }, [isAdmin, isActive]);

  return (
    <DrawerContent className="px-8 pb-6">
      <DrawerHeader className="text-left">
        <DrawerTitle>Change User Status for {username}</DrawerTitle>
        <DrawerDescription>
          Change the user status as an administrator or active
        </DrawerDescription>
      </DrawerHeader>
      <ChangeUserStatusComponent
        checkIsAdmin={checkIsAdmin}
        setCheckIsAdmin={setCheckIsAdmin}
        checkIsActive={checkIsActive}
        setCheckIsActive={setCheckIsActive}
      />
      <DrawerFooter className="pt-2">
        <div className="flex justify-end space-x-4">
          <Button
            variant="secondary"
            onClick={async () => {
              setIsLoading(true);
              await func(userId, checkIsAdmin, checkIsActive);
              setIsLoading(false);
            }}
          >
            {isLoading ? (
              <Icons.spinner className="h-5 w-5 animate-spin" />
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </DrawerFooter>
    </DrawerContent>
  );
};

const UpdateDialog = ({
  userId,
  usersInfo,
  func,
}: {
  userId: string;
  usersInfo: any;
  func: (userId: string, isAdmin: boolean, isActive: boolean) => Promise<void>;
}) => {
  const user = usersInfo.find((user: User) => user.id === userId);
  const { username, isAdmin = false, isActive = false } = user || {};

  const [checkIsAdmin, setCheckIsAdmin] = useState<boolean>(isAdmin);
  const [checkIsActive, setCheckIsActive] = useState<boolean>(
    Boolean(isActive)
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setCheckIsAdmin(isAdmin);
    setCheckIsActive(isActive);
  }, [isAdmin, isActive]);

  return (
    <DialogContent className="min-w-[50%]">
      <DialogHeader>
        <DialogTitle>Change User Status for {username}</DialogTitle>
        <DialogDescription>
          Change the user status as an administrator or active
        </DialogDescription>
      </DialogHeader>
      <ChangeUserStatusComponent
        checkIsAdmin={checkIsAdmin}
        setCheckIsAdmin={setCheckIsAdmin}
        checkIsActive={checkIsActive}
        setCheckIsActive={setCheckIsActive}
      />
      <DialogFooter>
        <div className="space-x-4">
          <Button
            variant="secondary"
            onClick={async () => {
              setIsLoading(true);
              await func(userId, checkIsAdmin, checkIsActive);
              setIsLoading(false);
            }}
          >
            {isLoading ? (
              <Icons.spinner className="h-5 w-5 animate-spin" />
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
};

const ChangeUserStatusComponent = ({
  checkIsAdmin,
  setCheckIsAdmin,
  checkIsActive,
  setCheckIsActive,
}: {
  checkIsAdmin: boolean;
  setCheckIsAdmin: (value: boolean) => void;
  checkIsActive: boolean;
  setCheckIsActive: (value: boolean) => void;
}) => {
  return (
    <div className="grid grid-cols-2 justify-items-center py-4">
      <div className="flex items-center space-x-4">
        <TypographyH5>Administrator</TypographyH5>
        <Switch
          checked={checkIsAdmin}
          onCheckedChange={setCheckIsAdmin}
        ></Switch>
      </div>
      <div className="flex items-center space-x-4">
        <TypographyH5>Active</TypographyH5>
        <Switch
          checked={checkIsActive}
          onCheckedChange={setCheckIsActive}
        ></Switch>
      </div>
    </div>
  );
};
