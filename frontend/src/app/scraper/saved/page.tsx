"use client";

import { AnimeCard } from "@/components/AnimeCard";
import { Header } from "@/components/pageComponents/Header";
import { TypographyH2 } from "@/components/ui/typography";
import { useEffect, useState } from "react";
import { Anime } from "@/utils/interfaces";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { signOut, useSession } from "next-auth/react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Saved() {
  const { data } = useSession();
  const { user: { token = "" } = {} } = data || {};
  const { toast } = useToast();
  const [indexedAnimeList, setIndexedAnimeList] = useState<{
    [key: string]: Anime;
  }>({});
  const [isLoadingSavedList, setIsLoadingSavedList] = useState(true);

  useEffect(() => {
    setIsLoadingSavedList(true);
    (async () => {
      try {
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

        setIndexedAnimeList(indexedItems);
        toast({
          title: "Success",
          description: "Fetched data successfully",
        });
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
            title: "Internal server error",
            description: "Please try again later",
          });
        }
      } finally {
        setIsLoadingSavedList(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, token]);

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
          <TypographyH2 className="pb-4 lg:pb-8">Your saved</TypographyH2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {isLoadingSavedList
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
              : Object.keys(indexedAnimeList).map((key) => {
                  const saved = indexedAnimeList[key];
                  const { name, image, animeId, isSaved } = saved;
                  const img64 = `data:image/png;base64,${image}`;
                  return (
                    <AnimeCard
                      key={animeId}
                      name={name}
                      image={img64}
                      animeId={animeId}
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