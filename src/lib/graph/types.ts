export type ValuesUnion<T extends object> = T[keyof T];

export const TimeRange = {
  "1D": "1D",
  "5D": "5D",
  "6M": "6M",
  "1Y": "1Y",
  "MAX": "MAX",
} as const;

export type TimeRange = ValuesUnion<typeof TimeRange>;

export type DateLineChartData = {
  x: Date;
  y: number;
};
