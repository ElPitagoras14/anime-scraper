import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ChangePassword() {
  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="outline" className="cursor-pointer">Change Password</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
