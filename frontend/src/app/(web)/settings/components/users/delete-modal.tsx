import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TrashIcon } from "lucide-react";

interface DeleteModalProps {
  userId: string;
  username: string;
}

export default function DeleteModal({ username }: DeleteModalProps) {
  return (
    <Dialog>
      <DialogTrigger>
        <TrashIcon className="text-red-500 dark:text-red-400 w-6 h-6 cursor-pointer" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
        </DialogHeader>
        <span>
          Are you sure you want to delete{" "}
          <strong>&quot;{username}&quot;</strong>?
        </span>
        <div className="flex justify-end gap-x-4">
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
