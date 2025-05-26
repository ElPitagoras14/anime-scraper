import { Icons } from "@/components/ui/icons";

export default async function Page() {
  return (
    <div className="flex flex-col h-svh justify-center items-center gap-y-4">
      <Icons.spinner className="w-24 h-24 animate-spin" />
    </div>
  );
}
