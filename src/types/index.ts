export type Project = {
  [key: string]: string | number | boolean | Date | null | string[];
  __id__?: string; // Internal ID for linking
};

export type SortConfig = {
  key: string;
  direction: 'ascending' | 'descending';
} | null;
