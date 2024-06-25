import type { DateLineChartData } from "$lib/graph/types";

export type IncompleteUnstakeAnalytics = {
  controller: string;
  debtAmount: string;
  providerRedemption: number;
  reserveAmount: number;
  startTime: Date;
  unbondAmount: number;
  vaultDebt: number;
};

export type UnstakeAnalytics = {
  pnl: number;
  startTime: Date;
  endTime: Date;
  controller: string;
};

export type ControllerAnalytics = {
  controller: string;
  pnlData: DateLineChartData[];
  frequency: DateLineChartData[];
  offerDenom: string;
  askDenom: string;
};
