import Image from "next/image";
import CustomTooltip from "./custom-tooltip";
import Link from "next/link";
import { TypographyH5 } from "./ui/typography";

interface AnimeCardProps {
  name: string;
  image: string;
  animeId: string;
  isSaved: boolean;
}

export default function AnimeCard({
  name,
  image,
  animeId,
  isSaved,
}: AnimeCardProps) {
  return (
    <div className="flex flex-col mb-4 items-center">
      <div className="relative hover:cursor-pointer min-w-[120px] w-[20vw] lg:w-[20vw] lg:max-w-[180px] min-h-[200px] h-[30vw] lg:h-[30vw] lg:max-h-[250px] flex justify-center">
        <Link href={`/scraper/info/${animeId}`}>
          <Image
            src={image}
            alt=""
            layout="fill"
            className="rounded-md object-cover"
          />
        </Link>
        <CustomTooltip
          name={name}
          animeId={animeId}
          isSaved={isSaved}
        ></CustomTooltip>
      </div>
      <TypographyH5 className="text-center mt-4 text-wrap min-w-[120px] w-[20vw] lg:w-[20vw] lg:max-w-[180px]">
        {name}
      </TypographyH5>
    </div>
  );
}
