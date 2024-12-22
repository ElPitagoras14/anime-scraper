import { Icons } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TypographyH2 } from "@/components/ui/typography";

const allWeekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function CalendarLoading() {
  return (
    <main className="flex flex-col items-center py-10">
      <div className="flex flex-col w-[80%] space-y-8">
        <div className="flex space-x-4">
          <TypographyH2>Emission Calendar</TypographyH2>
          <Icons.spinner className="ml-2 mt-2 h-6 w-6 animate-spin" />
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
                    <div className="m-1 h-8">
                      <Skeleton className="w-full h-full"></Skeleton>
                    </div>
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
