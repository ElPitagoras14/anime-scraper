export interface QueryParams {
  sorting?: {
    id: string;
    desc: boolean;
  }[];
  pagination?: {
    pageIndex?: number;
    pageSize?: number;
  };
  filter?: {
    id: string;
    value: unknown;
  }[];
}

export interface Download {
  id: string;
  isReady: boolean;
  link: string;
  service: string;
  fileName: string;
  date: string;
  anime: string;
  episodeId: number;
  name: string;
  image: string;
  progress: number;
  totalSize?: number;
}

export interface FieldInfo {
  name: string;
  initValue: string;
  label: string;
  placeholder: string;
  type: string;
  validation: any;
}

export interface Anime {
  animeId: string;
  name: string;
  image: string;
  isSaved: boolean;
  weekDay: string;
}
