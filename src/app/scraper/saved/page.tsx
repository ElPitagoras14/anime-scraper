"use client";

import { AnimeCard } from "@/components/AnimeCard";
import { Header } from "@/components/pageComponents/Header";
import { TypographyH2 } from "@/components/ui/typography";
import { useEffect, useState } from "react";
import { Saved as SavedInterface } from "@/utils/interfaces";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Saved() {
  const [savedAnime, setSavedAnime] = useState<SavedInterface[]>([]);
  const [isLoadingSavedList, setIsLoadingSavedList] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    const savedListOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      url: `${BACKEND_URL}/api/v2/animes/saved`,
    };
    axios(savedListOptions)
      .then((response) => {
        const {
          data: {
            payload: { items },
          },
        } = response;
        setSavedAnime(items);
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
  }, [toast]);

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
              : savedAnime.map((saved) => {
                  const { name, imageSrc, animeId } = saved;
                  return (
                    <AnimeCard
                      key={animeId}
                      name={name}
                      imageSrc={imageSrc}
                      animeId={animeId}
                      saved={true}
                    ></AnimeCard>
                  );
                })}
          </div>
        </div>
      </main>
    </>
  );
}
