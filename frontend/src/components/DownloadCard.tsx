import Image from "next/image";
import { Card } from "./ui/card";
import { TypographyH6, TypographySmall } from "./ui/typography";
import { Progress } from "./ui/progress";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { format } from "date-fns";
import { useState } from "react";
import { Icons } from "./ui/icons";

interface DownloadCardProps {
  anime: string;
  episodeName: string;
  image: string;
  date: string;
  isFinished: boolean;
  progress: number;
  totalSize?: number;
  isReady?: boolean;
  deleteFn: () => void;
  playFn?: () => void;
}

const formatFileSize = (bytes: number): string => {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const formattedSize = (bytes / Math.pow(1024, i)).toFixed(2);
  return `${formattedSize} ${sizes[i]}`;
};

export const DownloadCard = ({
  anime,
  episodeName,
  image,
  date,
  isFinished,
  progress,
  totalSize = 0,
  isReady = false,
  deleteFn,
  playFn,
}: DownloadCardProps) => {
  const newDate = new Date(date);
  const formattedDate = format(newDate, "yyyy-MM-dd HH:mm");

  const [isLoadingDelete, setIsLoadingDelete] = useState<Boolean>(false);
  const imgb64 = `data:image/jpeg;base64,${image}`;

  return (
    <Card>
      <div className="relative flex items-center space-x-4 p-2 lg:p-4">
        <Image
          src={imgb64}
          alt={""}
          width={70}
          height={70}
          className="rounded-md"
        ></Image>
        <div className="flex flex-col w-full">
          <TypographyH6>
            {anime} - {episodeName}
          </TypographyH6>
          <TypographySmall>{formattedDate}</TypographySmall>
          <TypographySmall>
            {totalSize > 0 ? formatFileSize(totalSize) : ""}{" "}
            {progress === 0 ? "" : " - " + progress + "%"}
          </TypographySmall>
          <Progress
            value={isFinished ? 100 : progress}
            className="mt-2"
            progressColor={isFinished ? "bg-accent" : "bg-primary"}
          ></Progress>
        </div>
        {isLoadingDelete ? (
          <Button
            className="absolute top-2 end-2 rounded-full m-0 px-2 py-2"
            variant="ghost"
          >
            <Icons.spinner className="h-6 w-6 animate-spin" />
          </Button>
        ) : (
          <Button
            className="absolute top-2 end-2 rounded-full m-0 px-2 py-2"
            variant="ghost"
            onClick={() => {
              setIsLoadingDelete(true);
              setTimeout(() => {
                deleteFn();
              }, 200);
            }}
          >
            <X className="h-6 w-6"></X>
          </Button>
        )}
      </div>
    </Card>
  );
};
