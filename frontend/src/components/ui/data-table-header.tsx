import { Column } from "@tanstack/react-table";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export default function DataTableHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort) {
    return <div className={cn(className)}></div>;
  }

  const sortDirection = column.getIsSorted();
  return (
    <div
      className={cn(
        "flex justify-center items-center text-center",
        className
      )}
    >
      <Button
        variant="ghost"
        className=""
        onClick={() => {
          if (sortDirection === "asc") {
            column.toggleSorting(true);
          }
          if (sortDirection === "desc") {
            column.toggleSorting();
          }
          if (sortDirection === false) {
            column.toggleSorting(false);
          }
        }}
      >
        <span className="mr-1">{title}</span>
        {sortDirection === "asc" && <ArrowUp  className="h-5 w-5"/>}
        {sortDirection === "desc" && <ArrowDown  className="h-5 w-5"/>}
        {sortDirection === false && <ArrowUpDown  className="h-5 w-5"/>}
      </Button>
    </div>
  );
}
