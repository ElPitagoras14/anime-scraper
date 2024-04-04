"use client";

import { Header } from "@/components/pageComponents/Header";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  TypographyH2,
  TypographyH3,
  TypographyP,
} from "@/components/ui/typography";
import {
  setBrowserUse,
  setMaxConcurrentDownloads,
} from "@/redux/features/downloadSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

export default function Home() {
  const { browserUse, maxConcurrentDownloads } = useAppSelector(
    (state: { downloadReducer: any }) => state.downloadReducer
  );

  const dispatch = useAppDispatch();

  return (
    <>
      <Header></Header>
      <main className="flex flex-col items-center py-10">
        <div className="flex flex-col w-[60%] space-y-8">
          <TypographyH2>Settings</TypographyH2>
          <div className="flex flex-col space-y-4">
            <div className="space-y-0">
              <TypographyH3>Browser Use</TypographyH3>
              <TypographyP>
                It allows to use the browser Download API to download.
              </TypographyP>
            </div>
            <div className="flex items-center ml-8 space-x-8">
              <Switch
                checked={browserUse}
                onCheckedChange={(checked) => {
                  dispatch(setBrowserUse(checked));
                }}
              ></Switch>
            </div>
          </div>
          <Separator></Separator>
          <div className="flex flex-col space-y-4">
            <div className="space-y-0">
              <TypographyH3>App Use</TypographyH3>
              <TypographyP>
                It allows to use the app to download files. We reccomend to use
                4 concurrent downloads.
              </TypographyP>
            </div>
            <div className="flex items-center ml-8 space-x-8">
              <Switch
                checked={!browserUse}
                onCheckedChange={(checked) => {
                  if (checked) {
                    dispatch(setBrowserUse(false));
                  } else {
                    dispatch(setBrowserUse(true));
                  }
                }}
              ></Switch>
              <Input
                placeholder="Max concurrent downloads"
                value={maxConcurrentDownloads || 1}
                disabled={browserUse}
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
