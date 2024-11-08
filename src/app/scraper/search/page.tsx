"use client";

import { AnimeCard } from "@/components/AnimeCard";
import { Header } from "@/components/pageComponents/Header";
import { TypographyH2 } from "@/components/ui/typography";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Search() {
  const searchParams = useSearchParams();
  const animeName = `${searchParams.get("anime")}`;
  const { data } = useSession();
  const { user: { token = "" } = {} } = data || {};

  const [animeList, setAnimeList] = useState([]);
  const [isLoadingAnimeList, setIsLoadingAnimeList] = useState<boolean>(true);
  const [savedAnime, setSavedAnime] = useState({});
  const [isLoadingSavedList, setIsLoadingSavedList] = useState<boolean>(true);

  const { toast } = useToast();

  useEffect(() => {
    const animeListOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      url: `${BACKEND_URL}/api/v2/animes/search?query=${animeName}`,
    };
    axios(animeListOptions)
      .then((response) => {
        const {
          data: {
            payload: { items },
          },
        } = response;
        setAnimeList(items);
      })
      .catch((error) => {
        toast({
          title: "Error fetching data",
          description: "Please try again later",
        });
      })
      .finally(() => {
        setIsLoadingAnimeList(false);
        setIsLoadingSavedList(false);
      });

    // const savedListOptions = {
    //   method: "GET",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   url: `${BACKEND_URL}/api/v2/anime/saved`,
    // };
    // axios(savedListOptions)
    //   .then((response) => {
    //     const {
    //       data: {
    //         payload: { items },
    //       },
    //     } = response;
    //     const saved = items.reduce(
    //       (
    //         acc: {
    //           [key: string]: Saved;
    //         },
    //         item: Saved
    //       ) => {
    //         acc[item.animeId] = item;
    //         return acc;
    //       },
    //       {}
    //     );
    //     setSavedAnime(saved);
    //   })
    //   .catch((error) => {
    //     toast({
    //       title: "Error fetching data",
    //       description: "Please try again later",
    //     });
    //   })
    //   .finally(() => {
    //     setIsLoadingSavedList(false);
    //   });
  }, [animeName, toast, token]);

  const examplesLength = 4;
  const exampleArray = Array.from({ length: examplesLength }, (_, i) => i);

  return (
    <>
      <Header></Header>
      <main className="flex flex-col items-center py-5 lg:py-10">
        <div className="w-[90%] lg:w-[80%]">
          <TypographyH2 className="pb-4 lg:pb-8">
            Result list for &quot;{animeName}&quot;
          </TypographyH2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {isLoadingAnimeList || isLoadingSavedList
              ? exampleArray.map((ex, idx) => {
                  return (
                    <div
                      key={idx}
                      className="flex flex-col mb-4 justify-center items-center"
                    >
                      <Skeleton className="min-w-[120px] w-[20vw] lg:w-[20vw] lg:max-w-[180px] min-h-[200px] h-[30vw] lg:h-[30vw] lg:max-h-[250px]"></Skeleton>
                      <Skeleton className="min-w-[120px] w-[20vw] lg:w-[20vw] lg:max-w-[180px] min-h-[16px] h-[6vw] md:h-[4vw] lg:h-[6vw] lg:max-h-[36px] mt-2"></Skeleton>
                    </div>
                  );
                })
              : animeList.map((anime) => {
                  const { name, animeId, imageSrc } = anime;
                  const saved = savedAnime.hasOwnProperty(animeId);
                  return (
                    <AnimeCard
                      key={animeId}
                      name={name}
                      animeId={animeId}
                      imageSrc={imageSrc}
                      saved={saved}
                    ></AnimeCard>
                  );
                })}
          </div>
        </div>
      </main>
    </>
  );
}
