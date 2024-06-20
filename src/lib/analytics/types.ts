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
  "Profit & Loss": number;
  "Reserve Amount": number;
  time: Date;
  controller: string;
};

export type ControllerAnalytics = {
    controller: string;
    pnlData: DateLineChartData[];
    reserveData: DateLineChartData[];
    offerDenom: string;
    askDenom: string;
  };