import AnimeCardSkeleton from "@/components/anime-card-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-y-4">
      <span className="text-xl lg:text-3xl font-semibold">Saved Animes</span>
      <div className="flex flex-row flex-wrap justify-between lg:justify-start lg:gap-x-9 gap-y-4 pb-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <AnimeCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
