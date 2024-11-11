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
  imageSrc: string;
  progress: number;
  totalSize?: number;
}

export interface Saved {
  animeId: string;
  name: string;
  imageSrc: string;
  weekDay: string;
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
  imageSrc: string;
  isSaved: boolean;
  weekDay: string;
}
