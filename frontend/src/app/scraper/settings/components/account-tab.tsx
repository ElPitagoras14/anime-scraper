"use client";

import FieldLabel from "@/components/field-label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DialogHeader,
  DialogFooter,
  DialogTrigger,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Form } from "@/components/ui/form";
import { Icons } from "@/components/ui/icons";
import { TypographyH4, TypographySmall } from "@/components/ui/typography";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useIsMobile } from "@/utils/utils";
import { Session } from "next-auth";
import { Label } from "@/components/ui/label";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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

const updateUserInfo = async (data: any, userId: string, token: string) => {
  const { username, currentPassword, newPassword } = data;

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

  return newToken;
};

const getAvatars = async () => {
  const avatarsOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    url: `/api/users/avatars`,
  };

  const response = await axios(avatarsOptions);
  const { data } = response;

  return data;
};

const changeAvatar = async (avatar: string, token: string) => {
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
  return avatar;
};

export default function AccountTab() {
  const isMobile = useIsMobile();
  const { data, update } = useSession();
  const {
    user: { token = "", id: userId = "", username = "", avatar = "" } = {},
  } = data || {};

  const [isLoading, setIsLoading] = useState(false);
  const [avatars, setAvatars] = useState<string[]>([]);

  const { toast } = useToast();

  indexedFields.username.initValue = username;
  indexedFields.username.placeholder = username;

  const initialValues = fields.reduce((acc, field) => {
    acc[field.name] = field.initValue;
    return acc;
  }, {} as any);

  const form = useForm<z.infer<typeof validationSchema>>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    (async () => {
      const avatars = await getAvatars();
      setAvatars(avatars);
    })();
  }, []);

  const handleSubmitForm = async (formData: any) => {
    setIsLoading(true);
    try {
      const newToken = await updateUserInfo(formData, userId!, token);
      await update({ ...data, user: { ...data!.user, token: newToken } });
      toast({
        title: "User updated",
        description: "The user was successfully updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An error occurred while updating the user",
      });
      if (!error.response) {
      }

      const { response: { status = 500, data: { message = "" } = {} } = {} } =
        error;

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
      setIsLoading(false);
    }
  };

  const handleChangeAvatar = async (avatar: string) => {
    try {
      const newAvatar = await changeAvatar(avatar, token);
      await update({ ...data, user: { ...data!.user, avatar: newAvatar } });
      toast({
        title: "Avatar updated",
        description: "The avatar was successfully updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An error occurred while changing the avatar",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmitForm)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 mx-6 my-6 gap-y-2 lg:gap-y-2 gap-x-10">
          <div className="col-span-1">
            <TypographyH4>{username}</TypographyH4>
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
                          Make changes to your profile here. Click save when
                          you&apos;re done.
                        </DrawerDescription>
                      </DrawerHeader>
                      <AvatarsGrid
                        avatars={avatars}
                        changeAvatar={handleChangeAvatar}
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
                        changeAvatar={handleChangeAvatar}
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
            disabled={!form.formState.isDirty || !form.formState.isValid}
            type="submit"
          >
            {isLoading ? (
              <Icons.spinner className="h-5 w-5 animate-spin" />
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

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
