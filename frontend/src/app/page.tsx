import { ArrowRightIcon, TelescopeIcon } from "lucide-react";
import Link from "next/link";

export default async function Page() {
  return (
    <div className="flex flex-col h-svh justify-center items-center gap-y-4 mx-4 lg:mx-12">
      <div className="w-[100%] h-[100%] border flex flex-col justify-center items-center my-4 lg:my-12">
        <div className="w-full sm:w-96 flex flex-col gap-y-10">
          <TelescopeIcon className="w-8 h-8 self-center lg:self-start" />
          <div className="flex flex-col gap-y-2">
            <p className="text-xl font-semibold text-center sm:text-left">
              Your all-in-one platform to download, follow, and organize anime
              shows.
            </p>
            <span className="text-base font-semibold text-muted-foreground text-center sm:text-left">
              Start watching anime today!
            </span>
          </div>
          <div className="flex flex-row self-center lg:self-start">
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