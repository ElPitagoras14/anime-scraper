import { ArrowRightIcon, TelescopeIcon } from "lucide-react";
import Link from "next/link";

export default async function Page() {
  return (
    <div className="flex flex-col h-svh justify-center items-center gap-y-4 border">
      <div className="w-[90%] h-[80%] border flex flex-col justify-center items-center">
        <div className="w-96 flex flex-col gap-y-10">
          <TelescopeIcon className="w-8 h-8" />
          <div className="flex flex-col gap-y-2">
            <p className="text-xl font-semibold">
              Your all-in-one platform to download, follow, and organize anime
              shows.
            </p>
            <span className="text-base font-semibold text-muted-foreground">
              Start watching anime today!
            </span>
          </div>
          <div className="flex flex-row">
            <Link
              href="/login"
              className="flex flex-row gap-x-2 items-center text-blue-500 hover:underline"
            >
              <p>Login</p>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
