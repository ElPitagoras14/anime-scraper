import axios from "axios";
import { auth } from "@/auth";
import { TypographyH2 } from "@/components/ui/typography";
import AnimeCard from "@/components/anime-card";

const BACKEND_URL = process.env.NEXT_PUBLIC_SERVER_BACKEND_URL;

const getAnimeList = async (animeName: string, token: string) => {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const animeListOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: `${BACKEND_URL}/api/v2/animes/search?query=${animeName}`,
  };

  const response = await axios(animeListOptions);

  const {
    data: {
      payload: { items },
    },
  } = response;

  const indexedItems = items.reduce((acc: any, item: any) => {
    const { animeId } = item;
    return { ...acc, [animeId]: item };
  }, {});

  return indexedItems;
};

export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string }>;
}) {
  const { user: { token = "" } = {} } = (await auth()) || {};
  const { anime: animeName } = (await searchParams) || {};

  const indexedAnimeList = await getAnimeList(animeName, token!);

  return (
    <main className="flex flex-col items-center py-5 lg:py-10">
      <div className="w-[90%] lg:w-[80%]">
        <TypographyH2 className="pb-4 lg:pb-8">
          Result list for &quot;{animeName}&quot;
        </TypographyH2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {Object.keys(indexedAnimeList).map((key: any) => {
            const anime = indexedAnimeList[key];
            const { name, animeId, image, isSaved } = anime || {};
            return (
              <AnimeCard
                key={animeId}
                name={name}
                animeId={animeId}
                image={image}
                isSaved={isSaved}
              ></AnimeCard>
            );
          })}
        </div>
      </div>
    </main>
  );
}
