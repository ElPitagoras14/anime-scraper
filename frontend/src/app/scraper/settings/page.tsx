"use client";

import FieldLabel from "@/components/FieldLabel";
import { Header } from "@/components/pageComponents/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TypographyH4,
  TypographyH5,
  TypographyH6,
  TypographySmall,
} from "@/components/ui/typography";
import { setMaxConcurrentDownloads } from "@/redux/features/downloadSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpDown, Bookmark } from "lucide-react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Label } from "@/components/ui/label";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  IconCircleCheck,
  IconCircleX,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Icons } from "@/components/ui/icons";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/utils/utils";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

type CustomColumnDef<T> = ColumnDef<T> & {
  label?: string;
};

const fields = [
  {
    name: "username",
    initValue: "",
    label: "Username",
    placeholder: "funnybunny",
    type: "text",
    validation: z
      .string()
      .min(4, { message: "Username is too short" })
      .max(50, { message: "Username is too long" })
      .regex(/^[a-zA-Z]+[a-zA-Z0-9_]*$/, { message: "Invalid username" }),
  },
  {
    name: "currentPassword",
    initValue: "",
    label: "Current Password",
    placeholder: "",
    type: "password",
    validation: z
      .string()
      .min(6, { message: "Password is too short" })
      .max(32, { message: "Password is too long" })
      .optional()
      .or(z.literal("")),
  },
  {
    name: "newPassword",
    initValue: "",
    label: "New Password",
    placeholder: "",
    type: "password",
    validation: z
      .string()
      .min(6, { message: "Password is too short" })
      .max(32, { message: "Password is too long" })
      .optional()
      .or(z.literal("")),
  },
  {
    name: "confirmPassword",
    initValue: "",
    label: "Confirm Password",
    placeholder: "",
    type: "password",
    validation: z
      .string()
      .min(6, { message: "Password is too short" })
      .max(32, { message: "Password is too long" })
      .optional()
      .or(z.literal("")),
  },
];

const indexedFields = fields.reduce((acc, field) => {
  acc[field.name] = field;
  return acc;
}, {} as any);

const validationSchema = z
  .object(
    fields.reduce((acc, field) => {
      acc[field.name] = field.validation;
      return acc;
    }, {} as any)
  )
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      return data.currentPassword ? !!data.newPassword : true;
    },
    {
      message: "New Password is required when Current Password is provided",
      path: ["newPassword"],
    }
  );

interface AnimeInfo {
  id: string;
  name: string;
  size: number;
}

interface User {
  id: string;
  username: string;
  avatar: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const LoadableIcon = ({
  Icon,
  func,
}: {
  Icon: React.ElementType;
  func: () => Promise<void>;
}) => {
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
        className="cursor-pointer hover:text-primary"
        onClick={async () => {
          setIsLoading(true);
          await func();
          setIsLoading(false);
        }}
      ></Icon>
    </div>
  );
};

const LoadableAvatar = ({
  avatar = "",
  func,
}: {
  avatar: string;
  func: () => Promise<void>;
}) => {
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
};

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

const AvatarsGrid = ({
  avatars,
  changeAvatar,
}: {
  avatars: string[];
  changeAvatar: (avatar: string) => Promise<void>;
}) => {
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-x-4 gap-y-8 justify-items-center">
      {avatars?.map((avatar: any) => {
        const path = `/avatars/${avatar}`;
        return (
          <div
            key={avatar}
            className="flex flex-col items-center justify-center space-y-4"
          >
            <LoadableAvatar avatar={path} func={() => changeAvatar(avatar)} />
          </div>
        );
      })}
    </div>
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

export default function Settings() {
  const { data, update } = useSession();
  const {
    user: {
      id: userId = "",
      username = "",
      token = "",
      isAdmin = true,
      avatar = "",
    } = {},
  } = data || {};
  const { maxConcurrentDownloads } = useAppSelector(
    (state: { downloadReducer: any }) => state.downloadReducer
  );
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const isMobile = useIsMobile();

  const [chartInfo, setChartInfo] = useState<any>({});
  const [usersInfo, setUsersInfo] = useState<any>([]);
  const [avatars, setAvatars] = useState<string[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [userFocusId, setUserFocusId] = useState("");

  const [isLoadingUpdating, setIsLoadingUpdating] = useState(false);

  indexedFields.username.initValue = username;

  const initialValues = fields.reduce((acc, field) => {
    acc[field.name] = field.initValue;
    return acc;
  }, {} as any);

  const { items = [], size = "", measuredIn = "" } = chartInfo || {};
  const chartData = items.map((item: any) => {
    const { animeId, name, size } = item;
    return {
      id: animeId,
      name,
      size,
    };
  });
  const chartColumns: ColumnDef<AnimeInfo>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "size",
      header: () => {
        return <div className="text-center">Size</div>;
      },
      cell: ({ row }) => {
        const { size } = row.original;
        return (
          <div className="text-right w-[80%]">
            {size.toFixed(2)} {measuredIn}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => {
        return <div className="text-center">Actions</div>;
      },
      cell: ({
        row: {
          original: { id },
        },
      }) => {
        return (
          <LoadableIcon
            Icon={IconTrash}
            func={() => deleteAnime(id)}
          ></LoadableIcon>
        );
      },
    },
  ];
  const chartConfig = chartData.reduce((acc: any, item: any) => {
    const { id, name } = item;
    acc[id] = {
      label: name,
    };
    return acc;
  }, {} as any) satisfies ChartConfig;

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
            <Avatar className="h-16 w-16 p-2">
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
      header: ({ column }) => {
        return (
          <div className="flex justify-center text-center">
            <Button
              variant="ghost"
              onClick={() => {
                column.toggleSorting(column.getIsSorted() === "asc");
              }}
            >
              Username
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      },
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
      header: ({ column }) => {
        return (
          <div className="flex justify-center text-center">
            <Button
              variant="ghost"
              onClick={() => {
                column.toggleSorting(column.getIsSorted() === "asc");
              }}
            >
              Member Since
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      },
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
      header: ({ column }) => {
        return (
          <div className="flex justify-center text-center">
            <Button
              variant="ghost"
              onClick={() => {
                column.toggleSorting(column.getIsSorted() === "asc");
              }}
            >
              Last Update
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      },
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

  if (isAdmin) {
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

  const form = useForm<z.infer<typeof validationSchema>>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    (async () => {
      try {
        const avatarsOptions = {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          url: `/api/users/avatars`,
        };

        const response = await axios(avatarsOptions);
        const { data } = response;
        setAvatars(data);
      } catch (error: any) {}
    })();
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    (async () => {
      await loadCache();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, token]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    (async () => {
      await loadUsers();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, token]);

  const loadCache = async () => {
    try {
      const chartOptions = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        url: `${BACKEND_URL}/api/v2/animes/cache`,
      };

      const response = await axios(chartOptions);
      const {
        data: { payload },
      } = response;
      setChartInfo(payload);
    } catch (error: any) {}
  };

  const loadUsers = async () => {
    try {
      const usersOptions = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        url: `${BACKEND_URL}/api/v2/users`,
      };

      const response = await axios(usersOptions);
      const {
        data: {
          payload: { items },
        },
      } = response;
      setUsersInfo(items);
    } catch (error: any) {
    } finally {
    }
  };

  const deleteAnime = async (animeId: string) => {
    try {
      const options = {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        url: `${BACKEND_URL}/api/v2/animes/cache/${animeId}`,
      };

      await axios(options);
      await loadCache();

      toast({
        title: "Anime deleted",
        description: "The anime was successfully deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the anime",
      });
    }
  };

  const changeAvatar = async (avatar: string) => {
    try {
      const options = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          avatar,
        },
        url: `${BACKEND_URL}/api/v2/users/avatar`,
      };

      await axios(options);
      await update({ avatar });
      toast({
        title: "Avatar changed",
        description: "The avatar was successfully changed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An error occurred while changing the avatar",
      });
    }
  };

  const changeUserStatus = async (
    userId: string,
    isAdmin: boolean,
    isActive: boolean
  ) => {
    try {
      const options = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          is_admin: isAdmin,
          is_active: isActive,
        },
        url: `${BACKEND_URL}/api/v2/users/status/${userId}`,
      };

      await axios(options);
      await loadUsers();
      toast({
        title: "User status changed",
        description: "The user status was successfully changed",
      });
    } catch (error: any) {
      if (!error.response) {
        toast({
          title: "Error",
          description: "An error occurred while changing the user status",
        });
      }

      const { response: { status = 500 } = {} } = error;

      if (status === 401) {
        toast({
          title: "Unauthorized",
          description: "Please login again",
        });
      }

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

  const updateUserInfo = async (data: any) => {
    setIsLoadingUpdating(true);
    const { username, currentPassword, newPassword } = data;
    try {
      const options = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: {
          username,
          current_password: currentPassword,
          new_password: newPassword,
        },
        url: `${BACKEND_URL}/api/v2/users/info/${userId}`,
      };

      const response = await axios(options);
      const {
        data: {
          payload: {
            token: { token: newToken },
          },
        } = {},
      } = response;
      await update({ username, token: newToken });

      toast({
        title: "User updated",
        description: "The user was successfully updated",
      });
    } catch (error: any) {
      if (!error.response) {
        toast({
          title: "Error",
          description: "An error occurred while updating the user",
        });
      }

      const { response: { status = 500, data: { message = "" } = {} } = {} } =
        error;

      if (status === 401) {
        toast({
          title: "Unauthorized",
          description: "Please login again",
        });
      }

      if (status === 409) {
        toast({
          title: "Conflict",
          description: message,
        });
      }

      if (status === 500) {
        toast({
          title: "Server error",
          description: "Please try again later",
        });
      }
    } finally {
      setIsLoadingUpdating(false);
    }
  };

  return (
    <>
      <Header></Header>
      <main className="flex flex-col items-center py-4 md:py-8">
        <div className="w-[90%] lg:w-[60%]">
          <Tabs defaultValue="account" orientation="horizontal">
            <TabsList className="w-[100%] h-11 lg:h-12">
              <TabsTrigger value="account" className="w-[100%]">
                <TypographyH6>Account</TypographyH6>
              </TabsTrigger>
              <TabsTrigger value="app" className="w-[100%]">
                <TypographyH6>App Settings</TypographyH6>
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="users" className="w-[100%]">
                  <TypographyH6>Users Management</TypographyH6>
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="account">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(updateUserInfo)}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 mx-6 my-6 gap-y-4 lg:gap-y-8 gap-x-10">
                    <div className="col-span-1">
                      <TypographyH4>Avatar</TypographyH4>
                      <div className="flex mt-3">
                        <Avatar className="h-24 w-24 p-3">
                          <AvatarImage src={`/avatars/${avatar}`}></AvatarImage>
                          <AvatarFallback>JG</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col justify-center ml-6">
                          {isMobile ? (
                            <Drawer>
                              <DrawerTrigger>
                                <Button variant="secondary" type="button">
                                  Change Avatar
                                </Button>
                              </DrawerTrigger>
                              <DrawerContent className="px-8 pb-6">
                                <DrawerHeader className="text-left">
                                  <DrawerTitle>Edit profile</DrawerTitle>
                                  <DrawerDescription>
                                    Make changes to your profile here. Click
                                    save when you&apos;re done.
                                  </DrawerDescription>
                                </DrawerHeader>
                                <AvatarsGrid
                                  avatars={avatars}
                                  changeAvatar={changeAvatar}
                                />
                                <DrawerFooter className="pt-2">
                                  <div className="flex justify-end">
                                    <TypographySmall>
                                      Designed by Freepik.
                                    </TypographySmall>
                                  </div>
                                </DrawerFooter>
                              </DrawerContent>
                            </Drawer>
                          ) : (
                            <Dialog>
                              <DialogTrigger>
                                <Button variant="secondary" type="button">
                                  Change Avatar
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="min-w-[70%]">
                                <DialogHeader>
                                  <DialogTitle>Change Picture</DialogTitle>
                                  <DialogDescription>
                                    Select a new avatar
                                  </DialogDescription>
                                </DialogHeader>
                                <AvatarsGrid
                                  avatars={avatars}
                                  changeAvatar={changeAvatar}
                                />
                                <DialogFooter>
                                  <div className="flex justify-end">
                                    <TypographySmall>
                                      Designed by Freepik.
                                    </TypographySmall>
                                  </div>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <TypographyH4>Statistics</TypographyH4>
                      <div className="flex flex-col space-y-2 mt-4">
                        <div className="flex items-center space-x-2">
                          <Bookmark className="text-primary"></Bookmark>
                          <Label>Animes Saved: WIP</Label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <TypographyH4>Username</TypographyH4>
                      <FieldLabel
                        fieldInfo={indexedFields.username}
                        formContext={form}
                        className="space-y-2 mt-2"
                      ></FieldLabel>
                    </div>
                    <div>
                      <TypographyH4>Change Password</TypographyH4>
                      <div className="flex flex-col space-y-4 mt-2">
                        <FieldLabel
                          fieldInfo={indexedFields.currentPassword}
                          formContext={form}
                        ></FieldLabel>
                        <FieldLabel
                          fieldInfo={indexedFields.newPassword}
                          formContext={form}
                        ></FieldLabel>
                        <FieldLabel
                          fieldInfo={indexedFields.confirmPassword}
                          formContext={form}
                        ></FieldLabel>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-md px-6 py-4 flex justify-end space-x-4">
                    <Button
                      variant="destructive"
                      disabled={!form.formState.isDirty}
                      onClick={(e) => {
                        e.preventDefault();
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={
                        !form.formState.isDirty || !form.formState.isValid
                      }
                      type="submit"
                    >
                      {isLoadingUpdating ? (
                        <Icons.spinner className="h-5 w-5 animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="app">
              <div className="my-6 space-y-6">
                <div className="mx-6 grid grid-cols-2 items-center gap-x-6">
                  <div className="space-y-1 md:space-y-3">
                    <TypographyH4>Max Concurrent Downloads</TypographyH4>
                    <p className="text-xs md:text-base text-muted-foreground">
                      Set the maximum number of concurrent downloads
                    </p>
                  </div>
                  <Input
                    className="w-[60%] justify-self-end"
                    placeholder="Max concurrent downloads"
                    value={maxConcurrentDownloads || 1}
                    onChange={(e) => {
                      const { target: { value } = {} } = e;
                      if (value === "") {
                        dispatch(setMaxConcurrentDownloads(1));
                      }
                      dispatch(
                        setMaxConcurrentDownloads(parseInt(e.target.value))
                      );
                    }}
                    required
                  ></Input>
                </div>
                {isAdmin && (
                  <>
                    <Separator></Separator>
                    <div className="mx-6 items-center space-y-6 ">
                      <div className="flex flex-col md:flex-row justify-between md:items-center">
                        <div className="space-y-1 md:space-y-2">
                          <TypographyH4>
                            Manage Cache ({measuredIn})
                          </TypographyH4>
                          <p className="text-xs md:text-base text-muted-foreground">
                            Clear the cache to free up space
                          </p>
                        </div>
                        <div className="flex items-center justify-between md:justify-normal space-x-4">
                          <TypographyH6>
                            Total data: {size}
                            {measuredIn}
                          </TypographyH6>
                          {isMobile ? (
                            <Drawer>
                              <DrawerTrigger>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={size === 0}
                                >
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
                                <DataTable
                                  columns={chartColumns}
                                  data={chartData}
                                ></DataTable>
                              </DrawerContent>
                            </Drawer>
                          ) : (
                            <Dialog>
                              <DialogTrigger disabled={size === 0}>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={size === 0}
                                >
                                  Clear Cache
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="min-w-[70%]">
                                <DialogHeader>
                                  <DialogTitle>Clean Data</DialogTitle>
                                  <DialogDescription>
                                    Select the data you want to clean
                                  </DialogDescription>
                                </DialogHeader>
                                <DataTable
                                  columns={chartColumns}
                                  data={chartData}
                                ></DataTable>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                      <ChartContainer
                        config={chartConfig}
                        className="w-full max-h-screen"
                      >
                        <BarChart
                          accessibilityLayer
                          data={chartData}
                          layout="vertical"
                          margin={{
                            left: 10,
                          }}
                        >
                          <YAxis
                            dataKey="id"
                            type="category"
                            tickLine={true}
                            tickMargin={5}
                            axisLine={false}
                            minTickGap={0}
                            tickFormatter={(
                              value: keyof typeof chartConfig
                            ) => {
                              return chartConfig[value]?.label.slice(0, 20);
                            }}
                          ></YAxis>
                          <XAxis
                            dataKey="size"
                            type="number"
                            tickFormatter={(value: number) => {
                              return `${value} ${measuredIn}`;
                            }}
                          ></XAxis>
                          <ChartTooltip
                            cursor={false}
                            content={
                              <ChartTooltipContent
                                nameKey="name"
                                indicator="dashed"
                              />
                            }
                          />
                          <Bar
                            dataKey="size"
                            layout="vertical"
                            radius={4}
                            fill="hsl(var(--primary))"
                          ></Bar>
                        </BarChart>
                      </ChartContainer>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
            {isAdmin && (
              <TabsContent value="users">
                <div className="my-6">
                  <DataTable
                    columns={usersColumns}
                    data={usersInfo}
                  ></DataTable>
                  {isMobile ? (
                    <Drawer open={openModal} onOpenChange={setOpenModal}>
                      <UpdateDrawer
                        userId={userFocusId}
                        usersInfo={usersInfo}
                        func={changeUserStatus}
                      ></UpdateDrawer>
                    </Drawer>
                  ) : (
                    <Dialog open={openModal} onOpenChange={setOpenModal}>
                      <UpdateDialog
                        userId={userFocusId}
                        usersInfo={usersInfo}
                        func={changeUserStatus}
                      ></UpdateDialog>
                    </Dialog>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </>
  );
}
