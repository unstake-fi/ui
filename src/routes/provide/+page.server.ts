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
      SELECT "endTime", "controller", "startTime", "protocolFee"
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

    const unstakeAnalyticsData: UnstakeAnalytics[] = completedEventAnalytics.rows.map((row) => ({
      pnl: row.protocolFee,
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
