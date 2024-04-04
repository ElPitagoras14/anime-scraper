"use client";

import { AnimeCard } from "@/components/AnimeCard";
import { Header } from "@/components/pageComponents/Header";
import { TypographyH2 } from "@/components/ui/typography";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Saved } from "@/utils/interfaces";
import { useToast } from "@/components/ui/use-toast";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Search() {
  const searchParams = useSearchParams();
  const animeName = `'${searchParams.get("anime")}'`;

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
      },
      url: `${BACKEND_URL}/api/v1/anime/search?query=${animeName}`,
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
      });

    const savedListOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      url: `${BACKEND_URL}/api/v1/anime/saved`,
    };
    axios(savedListOptions)
      .then((response) => {
        const {
          data: {
            payload: { items },
          },
        } = response;
        const saved = items.reduce(
          (
            acc: {
              [key: string]: Saved;
            },
            item: Saved
          ) => {
            acc[item.animeId] = item;
            return acc;
          },
          {}
        );
        setSavedAnime(saved);
      })
      .catch((error) => {
        toast({
          title: "Error fetching data",
          description: "Please try again later",
        });
      })
      .finally(() => {
        setIsLoadingSavedList(false);
      });
  }, [animeName, toast]);

  const examplesLength = 4;
  const exampleArray = Array.from({ length: examplesLength }, (_, i) => i);

  return (
    <>
      <Header></Header>
      <main className="flex flex-col items-center py-10">
        <div className="w-[80%] space-y-8">
          <TypographyH2 className="">Result list for {animeName}</TypographyH2>
          <div className="flex flex-wrap">
            {isLoadingAnimeList || isLoadingSavedList
              ? exampleArray.map((ex, idx) => {
                  return (
                    <div key={idx} className="mr-6">
                      <Skeleton className="w-[200px] h-[285px]"></Skeleton>
                      <Skeleton className="w-[200px] h-[40px] mt-4"></Skeleton>
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
