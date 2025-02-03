"use client";

import { Button } from "@/components/ui/button";
import {
  DialogHeader,
  DialogFooter,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icons } from "@/components/ui/icons";
import { useState } from "react";
import { IconEdit } from "@tabler/icons-react";
import { TypographyH5 } from "@/components/ui/typography";
import { Switch } from "@/components/ui/switch";
import { updateDataStatus } from "./utils";
import { useSession } from "next-auth/react";
import { User } from "./columns";
import { useToast } from "@/components/ui/use-toast";

interface UpdateDialogProps {
  item: User;
  updateData: () => Promise<void>;
}

export default function UpdateDialog({ item, updateData }: UpdateDialogProps) {
  const { data: session } = useSession();
  const { user: { token = "" } = {} } = session || {};
  const { id: userId, username, isAdmin = false, isActive = false } = item;
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [checkIsAdmin, setCheckIsAdmin] = useState<boolean>(isAdmin);
  const [checkIsActive, setCheckIsActive] = useState<boolean>(
    Boolean(isActive)
  );

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <IconEdit className="hover:text-primary cursor-pointer"></IconEdit>
      </DialogTrigger>
      <DialogContent className="min-w-[50%]">
        <DialogHeader>
          <DialogTitle>Change User Status for {username}</DialogTitle>
          <DialogDescription>
            Change the user status as an administrator or active
          </DialogDescription>
        </DialogHeader>
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
        <DialogFooter>
          <div className="space-x-4">
            <Button
              variant="secondary"
              onClick={async () => {
                setIsLoading(true);
                await handleUpdate();
                setIsLoading(false);
                setOpen(false);
              }}
            >
              {isLoading && (
                <Icons.spinner className="h-5 w-5 animate-spin mr-2" />
              )}
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
