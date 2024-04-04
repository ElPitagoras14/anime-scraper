"use client";

import { Header } from "@/components/pageComponents/Header";
import { Icons } from "@/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TypographyH2 } from "@/components/ui/typography";
import { useToast } from "@/components/ui/use-toast";
import { Saved as SavedInterface } from "@/utils/interfaces";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const CalendarAnimesComponent = ({ animes }: { animes: SavedInterface[] }) => {
  if (!animes) {
    return null;
  }
  return (
    <div className="flex flex-col justify-start">
      {animes.map((anime) => {
        const { name, animeId } = anime;
        return (
          <Link href={`/anime/${animeId}`} key={animeId}>
            <div className="p-2 m-1 rounded-sm bg-accent/50 hover:bg-accent hover:cursor-pointer">
              {name}
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default function CalendarPage() {
  const [savedAnime, setSavedAnime] = useState<SavedInterface[]>([]);
  const [isLoadingSavedList, setIsLoadingSavedList] = useState(true);

  const indexedByWeekDay = savedAnime.reduce((acc, anime) => {
    const weekDay = anime.weekDay;
    if (!acc[weekDay]) {
      acc[weekDay] = [];
    }
    acc[weekDay].push(anime);
    return acc;
  }, {} as Record<string, SavedInterface[]>);

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

  return (
    <>
      <Header></Header>
      <main className="flex flex-col items-center py-10">
        <div className="flex flex-col w-[80%] space-y-8">
          <div className="flex space-x-4">
            <TypographyH2>Emission Calendar</TypographyH2>
            {isLoadingSavedList && (
              <Icons.spinner className="ml-2 mt-2 h-6 w-6 animate-spin" />
            )}
          </div>
          <Table className="border rounded-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="border text-center w-[14.28%]">
                  Monday
                </TableHead>
                <TableHead className="border text-center w-[14.28%]">
                  Tuesday
                </TableHead>
                <TableHead className="border text-center w-[14.28%]">
                  Wednesday
                </TableHead>
                <TableHead className="border text-center w-[14.28%]">
                  Thursday
                </TableHead>
                <TableHead className="border text-center w-[14.28%]">
                  Friday
                </TableHead>
                <TableHead className="border text-center w-[14.28%]">
                  Saturday
                </TableHead>
                <TableHead className="border text-center w-[14.28%]">
                  Sunday
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-background">
                <TableCell className="border text-wrap m-0 p-0 align-top">
                  <CalendarAnimesComponent
                    animes={indexedByWeekDay["Monday"]}
                  />
                </TableCell>
                <TableCell className="border text-wrap m-0 p-0 align-top">
                  <CalendarAnimesComponent
                    animes={indexedByWeekDay["Tuesday"]}
                  />
                </TableCell>
                <TableCell className="border text-wrap m-0 p-0 align-top">
                  <CalendarAnimesComponent
                    animes={indexedByWeekDay["Wednesday"]}
                  />
                </TableCell>
                <TableCell className="border text-wrap m-0 p-0 align-top">
                  <CalendarAnimesComponent
                    animes={indexedByWeekDay["Thursday"]}
                  />
                </TableCell>
                <TableCell className="border text-wrap m-0 p-0 align-top">
                  <CalendarAnimesComponent
                    animes={indexedByWeekDay["Friday"]}
                  />
                </TableCell>
                <TableCell className="border text-wrap m-0 p-0 align-top">
                  <CalendarAnimesComponent
                    animes={indexedByWeekDay["Saturday"]}
                  />
                </TableCell>
                <TableCell className="border text-wrap m-0 p-0 align-top">
                  <CalendarAnimesComponent
                    animes={indexedByWeekDay["Sunday"]}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </main>
    </>
  );
}
