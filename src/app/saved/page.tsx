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
      url: `${BACKEND_URL}/api/v1/anime/saved`,
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
      <main className="flex flex-col items-center py-10">
        <div className="w-[80%] space-y-8">
          <TypographyH2 className="">Your saved</TypographyH2>
          <div className="flex flex-wrap">
            {isLoadingSavedList
              ? exampleArray.map((ex, idx) => {
                  return (
                    <div key={idx} className="mr-6">
                      <Skeleton className="w-[200px] h-[285px]"></Skeleton>
                      <Skeleton className="w-[200px] h-[40px] mt-4"></Skeleton>
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
