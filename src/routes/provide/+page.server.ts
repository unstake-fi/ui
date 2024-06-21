import { postgresQuery } from "$lib/postgres";
import type { PageServerLoad } from "./$types";
import type {
  UnstakeAnalytics,
  IncompleteUnstakeAnalytics,
} from "$lib/analytics/types";

export const load: PageServerLoad = async () => {
  try {
    // Query necessary data to calculate analytics for completed Unstake events
    const completedEventAnalytics = await postgresQuery(
      `
      SELECT "reserveAmount", ("returnAmount" - "repayAmount" - "reserveAmount") as pnl, "endTime", "controller", "startTime"
      FROM unstake 
      WHERE (NOT "startBlockHeight"=0) AND (NOT "endBlockHeight"=0) AND (NOT "controller"='')
      ORDER BY "startTime"
      `,
      []
    );


    // Query necessary data to calculate analytics for Unstake events that haven't ended
    const startedEventAnalytics = await postgresQuery(
      `
      SELECT "reserveAmount", "vaultDebt", "debtAmount", "providerRedemption","unbondAmount",  "startTime", "controller" 
      FROM unstake 
      WHERE (NOT "startBlockHeight"=0) AND ("endBlockHeight"=0) AND (NOT "controller"='')
      ORDER BY "startTime"
      `,
      []
    );

    const incompleteUnstakeAnalytics: IncompleteUnstakeAnalytics[] =
      startedEventAnalytics.rows.map((row) => ({
        controller: row.controller,
        debtAmount: row.debtAmount,
        providerRedemption: row.providerRedemption,
        reserveAmount: row.reserveAmount,
        startTime: row.startTime,
        unbondAmount: row.unbondAmount,
        vaultDebt: row.vaultDebt,
      }));

    const rows = completedEventAnalytics.rows;
    const unstakeAnalyticsData: UnstakeAnalytics[] = rows.map((row) => ({
      "Profit & Loss": row.pnl,
      "Reserve Amount": row.reserveAmount,
      startTime: row.startTime,
      endTime: row.endTime,
      controller: row.controller,
    }));

    return {
      unstakeAnalyticsData,
      incompleteUnstakeAnalytics,
    };
  } catch (err) {
    console.error(err);
    return {
      unstakeAnalyticsData: [],
      incompleteUnstakeAnalytics: [],
    };
  }
};
