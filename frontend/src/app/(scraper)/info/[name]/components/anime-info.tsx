import {
  TypographyH3,
  TypographyH4,
  TypographySmall,
} from "@/components/ui/typography";
import CustomTooltip from "@/components/custom-tooltip";
import Image from "next/image";

interface AnimeInfoProps {
  animeInfo: {
    name: string;
    description: string;
    image: string;
    isFinished: boolean;
    weekDay: string;
    isSaved: boolean;
  };
  animeId: string;
}

export default async function AnimeInfo({
  animeInfo,
  animeId,
}: AnimeInfoProps) {
  const { name, description, image, isFinished, weekDay, isSaved } = animeInfo;
  const imgb64 = `data:image/png;base64,${image}`;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-[24vh] h-[36vh] lg:w-[20vw] lg:h-[30vw] flex justify-center">
        <Image
          src={imgb64}
          alt=""
          layout="fill"
          className="rounded-md object-cover"
        />
        <CustomTooltip
          name={name}
          animeId={animeId}
          isSaved={isSaved}
        ></CustomTooltip>
      </div>
      <div className="rounded-md bg-accent w-3/6 lg:w-full mt-4">
        <TypographyH3 className="text-center py-3">
          {isFinished ? "Finished" : `New episode every ${weekDay}`}
        </TypographyH3>
      </div>
      <div className="px-2 pt-1 mt-3 lg:mt-6">
        <TypographyH4>{name}</TypographyH4>
        <TypographySmall className="text-start">{description}</TypographySmall>
      </div>
    </div>
  );
}
