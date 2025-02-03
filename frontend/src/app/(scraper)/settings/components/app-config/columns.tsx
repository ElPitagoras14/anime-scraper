import { CustomColumnDef } from "@/components/ui/data-table";

export interface AnimeInfo {
  animeId: string;
  name: string;
  size: number;
}

export const columns: CustomColumnDef<AnimeInfo>[] = [
  {
    accessorKey: "name",
    header: () => {
      return <div className="text-center">Name</div>;
    },
    cell: ({
      row: {
        original: { name },
      },
    }) => {
      return <div className="min-w-48">{name}</div>;
    }
  },
];
