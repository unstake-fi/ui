export type ValuesUnion<T extends object> = T[keyof T];

export const Range = {
  "1D": "1D",
  "5D": "5D",
  "6M": "6M",
  "1Y": "1Y",
  MAX: "MAX",
} as const;

export type Range = ValuesUnion<typeof Range>;

export type DateLineChartData = {
  time: Date;
  y: number;
};
