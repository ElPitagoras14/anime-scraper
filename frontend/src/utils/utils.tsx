import { QueryParams } from "./interfaces";
import { useEffect, useState } from "react";

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth <= 768);

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  return isMobile;
};

export const camelToSnake = (str: string | undefined) => {
  if (!str) return undefined;
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

export const getQueryParamsOptions = (params: QueryParams) => {
  const { pagination = {}, sorting = [], filter = [] } = params;
  let paramsOptions = {};
  if (Object.keys(pagination).length > 0) {
    const { pageIndex, pageSize } = pagination;
    paramsOptions = {
      page: pageIndex,
      size: pageSize,
    };
  }

  if (sorting.length > 0) {
    const [{ id, desc }] = sorting;
    const parsedId = camelToSnake(id);
    paramsOptions = {
      ...paramsOptions,
      sort_by: parsedId,
      desc,
    };
  }

  if (filter.length > 0) {
    const filterByColum: Record<string, unknown[]> = {};
    filter.forEach(({ id, value }: { id: string; value: unknown }) => {
      const parsedId = camelToSnake(id);
      if (!filterByColum[parsedId as keyof typeof filterByColum]) {
        filterByColum[parsedId as keyof typeof filterByColum] = [];
      }
      filterByColum[parsedId as keyof typeof filterByColum].push(value);
    });
    const urlSearchParams = new URLSearchParams();
    Object.entries(filterByColum).forEach(([key, value]) => {
      urlSearchParams.append(`filter[${key}]`, value.join(","));
    });
    paramsOptions = {
      ...paramsOptions,
      ...Object.fromEntries(urlSearchParams),
    };
  }

  return paramsOptions;
};

export const range = (start: number, end: number): number[] => {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};
