import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ChangeAvatar() {
  return (
    <Dialog>
      <DialogTrigger>
        <Button className="cursor-pointer">Change Avatar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Avatar</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
