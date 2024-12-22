import { Suspense } from "react";
import AnimeInfo from "./components/anime-info";
import { Skeleton } from "@/components/ui/skeleton";
import AnimeEpisodes from "./components/anime-episode";
import axios from "axios";
import { auth } from "@/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_SERVER_BACKEND_URL;

const getAnimeInfo = async (animeId: string, token: string) => {
  const animeInfoOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: `${BACKEND_URL}/api/v2/animes/info/${animeId}`,
  };

  const animeInfoResponse = await axios(animeInfoOptions);

  const {
    data: { payload: animeInfoPayload },
  } = animeInfoResponse;

  return animeInfoPayload;
};

export default async function InfoPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name: animeId } = await params;
  const { user: { token = "" } = {} } = (await auth()) || {};
  const animeInfo = await getAnimeInfo(animeId, token!);
  const { image } = animeInfo;

  return (
    <main className="flex justify-center">
      <div className="flex flex-col lg:grid lg:grid-cols-4 py-10 lg:space-x-24 space-y-4 lg:space-y-0 px-6 md:px-12 min-w-[100%] lg:min-w-0">
        <Suspense
          fallback={
            <div className="flex flex-col items-center text-center space-y-2 lg:space-y-4">
              <Skeleton className="w-[24vh] h-[36vh] lg:w-[20vw] lg:h-[30vw]"></Skeleton>
              <Skeleton className="w-[30vh] h-[6vh] lg:w-[20vw] lg:h-[3vw]"></Skeleton>
              <Skeleton className="w-[30vh] h-[2vh] lg:w-[20vw] lg:h-[2vw]"></Skeleton>
              <Skeleton className="w-[40vh] h-[16vh] lg:w-[22vw] lg:h-[20vw]"></Skeleton>
            </div>
          }
        >
          <AnimeInfo animeInfo={animeInfo} animeId={animeId} />
        </Suspense>
        <AnimeEpisodes animeId={animeId} image={image} />
      </div>
    </main>
  );
}
