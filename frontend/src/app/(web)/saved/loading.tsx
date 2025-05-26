import { Skeleton } from "@/components/ui/skeleton";

export default async function Page() {
  return (
    <div className="flex flex-col gap-y-10">
      <span className="text-3xl font-semibold">Searching anime results...</span>
      <Skeleton className="w-96 h-12" />
      <div className="flex flex-row flex-wrap gap-x-12 gap-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-y-2 w-46">
            <Skeleton className="h-60" />
            <Skeleton className="h-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
