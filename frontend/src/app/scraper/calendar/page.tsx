import { auth } from "@/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TypographyH2 } from "@/components/ui/typography";
import { Anime } from "@/utils/interfaces";
import axios from "axios";
import Link from "next/link";

const BACKEND_URL = process.env.NEXT_PUBLIC_SERVER_BACKEND_URL;

const allWeekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const CalendarAnimesComponent = ({ animes }: { animes: Anime[] }) => {
  if (!animes) {
    return null;
  }
  return (
    <div className="flex flex-col justify-start">
      {animes.map((anime) => {
        const { name, animeId } = anime;
        return (
          <Link href={`/scraper/info/${animeId}`} key={animeId}>
            <div className="p-2 m-1 rounded-sm bg-accent/50 hover:bg-accent hover:cursor-pointer">
              {name}
            </div>
          </Link>
        );
      })}
    </div>
  );
};

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

  return items;
};

export default async function CalendarPage() {
  const { user: { token = "" } = {} } = (await auth()) || {};
  const animeSavedList = await getAnimeSavedList(token!);

  const indexedByWeekDay = animeSavedList.reduce((acc: any, anime: any) => {
    const weekDay = anime.weekDay;
    if (!acc[weekDay]) {
      acc[weekDay] = [];
    }
    acc[weekDay].push(anime);
    return acc;
  }, {} as Record<string, Anime[]>);

  return (
    <main className="flex flex-col items-center py-10">
      <div className="flex flex-col w-[80%] space-y-8">
        <div className="flex space-x-4">
          <TypographyH2>Emission Calendar</TypographyH2>
        </div>
        <Table className="border rounded-sm">
          <TableHeader>
            <TableRow>
              {allWeekDays.map((weekDay) => {
                return (
                  <TableHead
                    key={`${weekDay}-header`}
                    className="border text-center w-[14.28%]"
                  >
                    {weekDay}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="hover:bg-background">
              {allWeekDays.map((weekDay) => {
                return (
                  <TableCell
                    key={weekDay}
                    className="border text-wrap m-0 p-0 align-top"
                  >
                    <CalendarAnimesComponent
                      animes={indexedByWeekDay[weekDay]}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
