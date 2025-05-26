import AnimeCard, { AnimeInfo } from "@/components/anime-card";
import { getApiServer } from "@/lib/api-server";

interface PageProps {
  params: Promise<{
    query: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { query } = await params;

  const apiServer = await getApiServer();

  const options = {
    method: "GET",
    url: "/animes/search",
    params: {
      query: query,
    },
  };

  const response = await apiServer(options);
  const {
    data: {
      payload: { items },
    },
  } = response;

  const decoded = decodeURIComponent(query);

  return (
    <div className="flex flex-col gap-y-10">
      <span className="text-3xl font-semibold">
        Search results for &quot;{decoded}&quot;
      </span>
      <div className="flex flex-row flex-wrap gap-x-9 gap-y-4">
        {items.map((item: AnimeInfo) => (
          <AnimeCard key={item.id} animeInfo={item} />
        ))}
      </div>
    </div>
  );
}
