"use client";

import { DownloadCard } from "@/components/DownloadCard";
import { Header } from "@/components/pageComponents/Header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  TypographyH2,
  TypographyH5,
  TypographySmall,
} from "@/components/ui/typography";
import {
  cancelDownload,
  finishDownload,
  quitFromQueue,
  setReadyDownload,
  startDownload,
  updateDownload,
} from "@/redux/features/downloadSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { Download } from "@/utils/interfaces";
import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function Downloads() {
  const { queue, downloading, browserUse, maxConcurrentDownloads } =
    useAppSelector((state: { downloadReducer: any }) => state.downloadReducer);

  const [isPaused, setIsPaused] = useState<boolean>(!browserUse);
  const [controllers, setControllers] = useState<
    Record<string, AbortController>
  >({});

  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const startNextDownload = () => {
    if (isPaused) {
      return;
    }
    if (queue.length === 0) {
      return;
    }
    if (downloading.length >= maxConcurrentDownloads) {
      return;
    }

    const readyDownloads = browserUse
      ? queue.filter((download: Download) => download.isReady)
      : queue;

    if (readyDownloads.length === 0) {
      return;
    }

    const nextDownload = readyDownloads[0];

    const { id, fileUrl, fileName } = nextDownload;

    if (browserUse) {
      dispatch(quitFromQueue({ id }));
      const link = document.createElement("a");
      link.href = fileUrl;
      if (fileUrl.includes("streamtape")) {
        link.target = "_blank";
      }
      link.setAttribute("download", fileName || "");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;
    setControllers((prevControllers) => ({
      ...prevControllers,
      [id]: controller,
    }));

    dispatch(startDownload({ id }));

    axios
      .get(fileUrl, {
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          const { total: eventTotal, loaded } = progressEvent;
          const total = eventTotal || 1;
          const current = loaded;
          const progress = parseFloat(((current / total) * 100).toFixed(2));
          dispatch(updateDownload({ id, progress, total }));
        },
        signal,
      })
      .then((response) => {
        const blob = new Blob([response.data]);
        const link = document.createElement("a");
        const url = window.URL.createObjectURL(blob);

        link.href = url;
        link.download = fileName;
        link.click();

        window.URL.revokeObjectURL(url);
        link.remove();

        dispatch(finishDownload({ id }));
      })
      .catch((error) => {
        console.error("Error downloading the file", error);
        dispatch(cancelDownload({ id }));
        startNextDownload();
      });
  };

  useEffect(() => {
    startNextDownload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, downloading, dispatch, isPaused]);

  const handleCancelDownload = (id: string) => {
    const controller = controllers[id];
    console.log("Controller-Cancel", controller);
    if (controller) {
      console.log("Aborting download", id);
      controller.abort();
    }
    dispatch(cancelDownload({ id }));
  };

  const handleQuitFromQueue = (id: string) => {
    dispatch(quitFromQueue({ id }));
  };

  const handlePlayDownload = (id: string) => {
    const currDownload = queue.find((download: Download) => download.id === id);
    if (!currDownload) return;
    dispatch(setReadyDownload({ id }));
  };

  return (
    <>
      <Header></Header>
      <main className="flex flex-col items-center py-6 lg:py-10">
        <div className="w-[90%] lg:w-[60%] space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <div className="flex flex-col">
              <TypographyH2>Downloads</TypographyH2>
              <TypographySmall>
                Please do not change the page during a download.
              </TypographySmall>
            </div>
            {isPaused ? (
              <Button
                size="default"
                disabled={queue.length === 0}
                variant="secondary"
                className="ml-auto"
                onClick={() => {
                  setIsPaused(false);
                  toast({
                    title: "Downloads started",
                    description: "Downloads will start shortly",
                  });
                }}
              >
                <TypographyH5>Start Downloads</TypographyH5>
              </Button>
            ) : (
              <Button
                size="default"
                variant="destructive"
                className="ml-auto"
                onClick={() => {
                  setIsPaused(true);
                  toast({
                    title: "Downloads stopped",
                    description: "Downloads will stop shortly",
                  });
                }}
              >
                <TypographyH5>Stop Downloads</TypographyH5>
              </Button>
            )}
          </div>
          <Accordion type="multiple">
            <AccordionItem value="downloading">
              <AccordionTrigger>
                Downloading ({downloading.length})
              </AccordionTrigger>
              <AccordionContent className="flex flex-col space-y-4">
                {downloading.map((download: Download) => {
                  const {
                    id,
                    anime,
                    name,
                    totalSize,
                    imageSrc,
                    date,
                    progress,
                  } = download || {};
                  return (
                    <DownloadCard
                      key={id}
                      anime={anime}
                      episodeName={name}
                      imageSrc={imageSrc}
                      date={date}
                      isFinished={false}
                      progress={progress}
                      totalSize={totalSize}
                      deleteFn={() => handleCancelDownload(id)}
                      isReady
                    ></DownloadCard>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="queue">
              <AccordionTrigger>Queue ({queue.length})</AccordionTrigger>
              <AccordionContent className="flex flex-col space-y-4">
                {queue.map((download: Download) => {
                  const {
                    id,
                    anime,
                    name,
                    imageSrc,
                    totalSize,
                    date,
                    progress,
                  } = download || {};
                  const isReady = queue.find(
                    (download: Download) => download.id === id
                  )?.isReady;
                  return (
                    <DownloadCard
                      key={id}
                      anime={anime}
                      episodeName={name}
                      imageSrc={imageSrc}
                      date={date}
                      isFinished={false}
                      progress={progress}
                      totalSize={totalSize}
                      deleteFn={() => handleQuitFromQueue(id)}
                      playFn={() => handlePlayDownload(id)}
                      isReady={isReady}
                    ></DownloadCard>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </main>
    </>
  );
}
