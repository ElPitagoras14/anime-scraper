"use client";

import { Button } from "@/components/ui/button";
import {
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  Drawer,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Icons } from "@/components/ui/icons";
import { useState } from "react";
import { IconEdit } from "@tabler/icons-react";
import { User } from "./columns";
import { updateDataStatus } from "./utils";
import { useSession } from "next-auth/react";
import { TypographyH5 } from "@/components/ui/typography";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

interface UpdateDrawerProps {
  item: User;
  updateData: () => Promise<void>;
}

export default function UpdateDrawerProps({
  item,
  updateData,
}: UpdateDrawerProps) {
  const { data: session } = useSession();
  const { user: { token = "" } = {} } = session || {};
  const { id: userId, username, isAdmin = false, isActive = false } = item;
  const { toast } = useToast();

  const [open, setOpen] = useState<boolean>(false);
  const [checkIsAdmin, setCheckIsAdmin] = useState<boolean>(isAdmin);
  const [checkIsActive, setCheckIsActive] = useState<boolean>(
    Boolean(isActive)
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      await updateDataStatus(token, userId, checkIsAdmin, checkIsActive);
      await updateData();
      setOpen(false);
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger>
        <IconEdit className="hover:text-primary cursor-pointer"></IconEdit>
      </DrawerTrigger>
      <DrawerContent className="px-8 pb-6">
        <DrawerHeader className="text-left">
          <DrawerTitle>Change User Status for {username}</DrawerTitle>
          <DrawerDescription>
            Change the user status as an administrator or active
          </DrawerDescription>
        </DrawerHeader>
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
        <DrawerFooter className="pt-2">
          <div className="flex justify-end space-x-4">
            <Button variant="secondary" onClick={handleUpdate}>
              {isLoading && (
                <Icons.spinner className="h-5 w-5 animate-spin mr-2" />
              )}
              Save
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
