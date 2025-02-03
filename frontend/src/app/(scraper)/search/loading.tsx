import { TypographyH2 } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";

export default async function SearchLoading() {
  const examplesLength = 4;
  const exampleArray = Array.from({ length: examplesLength }, (_, i) => i);

  return (
    <main className="flex flex-col items-center py-5 lg:py-10">
      <div className="w-[90%] lg:w-[80%]">
        <TypographyH2 className="pb-4 lg:pb-8">
          Searching for anime
        </TypographyH2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {exampleArray.map((ex, idx) => {
            return (
              <div
                key={idx}
                className="flex flex-col mb-4 justify-center items-center"
              >
                <Skeleton className="min-w-[120px] w-[20vw] lg:w-[20vw] lg:max-w-[180px] min-h-[200px] h-[30vw] lg:h-[30vw] lg:max-h-[250px]"></Skeleton>
                <Skeleton className="min-w-[120px] w-[20vw] lg:w-[20vw] lg:max-w-[180px] min-h-[16px] h-[6vw] md:h-[4vw] lg:h-[6vw] lg:max-h-[36px] mt-2"></Skeleton>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
