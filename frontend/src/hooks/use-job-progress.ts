// hooks/use-job-progress.ts
"use client";

import { useEffect, useState, useRef } from "react";
import { useDownloadProgress } from "@/providers/progress-provider";

interface ProgressMeta {
  jobId: string;
  state: string;
  progress?: number;
  size?: number;
}

export const useJobProgress = (jobId: string | null) => {
  const { progressMap } = useDownloadProgress();
  const [progress, setProgress] = useState<ProgressMeta | null>(null);
  const prevJobIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setProgress(null);
      prevJobIdRef.current = null;
      return;
    }

    // Solo actualizar si el jobId cambió o si el progressMap para este jobId cambió
    const currentProgress = progressMap[jobId];
    const prevJobId = prevJobIdRef.current;

    if (jobId !== prevJobId || currentProgress !== progress) {
      setProgress(currentProgress);
      prevJobIdRef.current = jobId;
    }
  }, [progressMap, jobId, progress]); // Dependencias correctas

  return progress;
};
