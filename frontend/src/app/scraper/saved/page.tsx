import { auth } from "@/auth";
import AnimeCard from "@/components/anime-card";
import { TypographyH2 } from "@/components/ui/typography";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_SERVER_BACKEND_URL;

const getAnimeSavedList = async (token: string) => {
  const savedListOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: `${BACKEND_URL}/api/v2/animes/saved`,
  };

  const response = await axios(savedListOptions);

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

export default async function Saved() {
  const { user: { token = "" } = {} } = (await auth()) || {};

  const indexedAnimeList = await getAnimeSavedList(token!);

  return (
    <main className="flex flex-col items-center py-5 lg:py-10">
      <div className="w-[90%] lg:w-[80%]">
        <TypographyH2 className="pb-4 lg:pb-8">Your saved</TypographyH2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {Object.keys(indexedAnimeList).map((key: any) => {
            const anime = indexedAnimeList[key];
            const { name, image, animeId, isSaved } = anime;
            const img64 = `data:image/png;base64,${image}`;
            return (
              <AnimeCard
                key={animeId}
                name={name}
                image={img64}
                animeId={animeId}
                isSaved={isSaved}
              ></AnimeCard>
            );
          })}
        </div>
      </div>
    </main>
  );
}
