import { Skeleton } from "@/components/ui/skeleton";

export default function AnimeCardSkeleton() {
  return (
    <div className="flex flex-col gap-y-2">
      <Skeleton className="w-46 h-64 rounded-md" />
      <div className="flex justify-center items-center">
        <Skeleton className="w-44 h-4" />
      </div>
    </div>
  );
}
