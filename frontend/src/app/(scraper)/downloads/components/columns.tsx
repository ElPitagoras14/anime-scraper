import { CustomColumnDef } from "@/components/ui/data-table";
import DataTableHeader from "@/components/ui/data-table-header";
import Image from "next/image";

export interface AnimeToDownload {
  episodeId: number;
  image: string;
  anime: string;
  episodeName: string;
  createdAt: string;
  status: string;
  progress: number;
  total: number;
  filename: string;
}

export const columns: CustomColumnDef<AnimeToDownload>[] = [
  {
    accessorKey: "image",
    header: () => {
      return <div className="text-center px-2">Image</div>;
    },
    cell: ({
      row: {
        original: { image },
      },
    }) => {
      const img64 = `data:image/png;base64,${image}`;
      return (
        <div className="w-full flex justify-center">
          <div className="relative w-[6vh] h-[9vh] lg:w-[4vw] lg:h-[6vw]">
            <Image
              src={img64}
              alt=""
              layout="fill"
              className="rounded-md object-cover"
            />
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "anime",
    label: "Anime",
    header: () => <div className="text-center">Anime</div>,
    cell: ({
      row: {
        original: { anime },
      },
    }) => {
      return <div className="text-center">{anime}</div>;
    },
  },
  {
    accessorKey: "episodeName",
    label: "Episode",
    header: () => <div className="text-center">Episode</div>,
    cell: ({
      row: {
        original: { episodeName },
      },
    }) => {
      return <div className="text-center">{episodeName}</div>;
    },
  },
  {
    accessorKey: "status",
    label: "Status",
    header: () => <div className="text-center">Status</div>,
  },
  {
    accessorKey: "total",
    label: "Total",
    header: () => <div className="text-center">Total</div>,
    cell: ({
      row: {
        original: { total },
      },
    }) => {
      return <div className="text-center">{total}</div>;
    },
  },
  {
    accessorKey: "createdAt",
    label: "Created At",
    header: () => <div className="text-center">Created At</div>,
    cell: ({
      row: {
        original: { createdAt },
      },
    }) => {
      return (
        <div className="text-center">
          {new Date(createdAt).toLocaleString("es-ES", {
            hour12: false,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
      );
    },
  },
];
