"use client";

import { AnimeCard } from "@/components/AnimeCard";
import { Header } from "@/components/pageComponents/Header";
import { TypographyH2 } from "@/components/ui/typography";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { signOut, useSession } from "next-auth/react";
import { Anime } from "@/utils/interfaces";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Search() {
  const searchParams = useSearchParams();
  const animeName = `${searchParams.get("anime")}`;
  const { data } = useSession();
  const { user: { token = "" } = {} } = data || {};

  const [indexedAnimeList, setIndexedAnimeList] = useState<{
    [key: string]: Anime;
  }>({});
  const [isLoadingAnimeList, setIsLoadingAnimeList] = useState<boolean>(true);

  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
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

        toast({
          title: "Success",
          description: "Fetched data successfully",
        });

        const indexedItems = items.reduce((acc: any, item: any) => {
          const { animeId } = item;
          return { ...acc, [animeId]: item };
        }, {});

        console.log("items", items);
        console.log("indexedItems", indexedItems);

        setIndexedAnimeList(indexedItems);
      } catch (error: any) {
        if (!error.response) {
          toast({
            title: "Error fetching data",
            description: "Please try again later",
          });
        }

        const { response: { status = 500 } = {} } = error;

        if (status === 401) {
          toast({
            title: "Unauthorized",
            description: "Please login again",
          });
          await signOut({
            callbackUrl: "/login",
          });
        }

        if (status === 500) {
          toast({
            title: "Server error",
            description: "Please try again later",
          });
        }
      } finally {
        setIsLoadingAnimeList(false);
      }
    })();
  }, [animeName, toast, token]);

  const setSavedAnime = (animeId: string, isSaved: boolean) => {
    setIndexedAnimeList((prev) => {
      const updatedList = { ...prev };
      updatedList[animeId].isSaved = isSaved;
      return updatedList;
    });
  };

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
            {isLoadingAnimeList
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
              : Object.keys(indexedAnimeList).map((key: any) => {
                  const anime = indexedAnimeList[key];
                  const { name, animeId, imageSrc, isSaved } = anime || {};
                  return (
                    <AnimeCard
                      key={animeId}
                      name={name}
                      animeId={animeId}
                      imageSrc={imageSrc}
                      isSaved={isSaved}
                      setSavedAnime={setSavedAnime}
                    ></AnimeCard>
                  );
                })}
          </div>
        </div>
      </main>
    </>
  );
}
