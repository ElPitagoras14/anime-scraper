"use client";

import { Header } from "@/components/pageComponents/Header";
import { Input } from "@/components/ui/input";
import {
  TypographyH2,
  TypographyH3,
  TypographyP,
} from "@/components/ui/typography";
import { setMaxConcurrentDownloads } from "@/redux/features/downloadSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

export default function Home() {
  const { maxConcurrentDownloads } = useAppSelector(
    (state: { downloadReducer: any }) => state.downloadReducer
  );

  const dispatch = useAppDispatch();

  return (
    <>
      <Header></Header>
      <main className="flex flex-col items-center py-5 md:py-7 lg:py-10">
        <div className="flex flex-col w-[80%] lg:w-[60%] space-y-2 md:space-y-4 lg:space-y-8">
          <TypographyH2>Settings</TypographyH2>
          <div className="grid lg:grid-cols-2 items-center">
            <div className="space-y-0 sm:space-y-2 lg:space-y-4">
              <TypographyH3>Max Concurrent Downloads</TypographyH3>
              <TypographyP>
                Set the maximum number of concurrent downloads
              </TypographyP>
            </div>
            <div className="max-w-[200px] pt-2 md:pt-6 lg:pt-0 lg:justify-self-center">
              <Input
                placeholder="Max concurrent downloads"
                value={maxConcurrentDownloads || 1}
                onChange={(e) => {
                  const { target: { value } = {} } = e;
                  if (value === "") {
                    dispatch(setMaxConcurrentDownloads(1));
                  }
                  dispatch(setMaxConcurrentDownloads(parseInt(e.target.value)));
                }}
                required
              ></Input>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
