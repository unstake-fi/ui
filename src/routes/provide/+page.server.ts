import { query } from "$lib/postgres";
import type { PageServerLoad } from "./$types";

type UnstakeAnalytics = {
  "Profit & Loss": number;
  "Reserve Amount": number;
  time: Date;
};

export const load: PageServerLoad = async () => {
  try {
    // TODO: use interest rates to calculate PNL for uncompleted unstake events
    // for now, only completed unstake events are used to calculate PnL.
    const protocolHealthResult = await query(
      `
      SELECT SUM("reserveAmount") as "reserveAmountSum", SUM(("returnAmount" - "repayAmount" - "reserveAmount")) as pnl, "endTime" 
      FROM unstake 
      WHERE NOT "funds"=''
      GROUP BY "endTime"
      ORDER BY "endTime"
      `,
      []
    );
    const rows = protocolHealthResult.rows;
    const unstakeAnalyticsData: UnstakeAnalytics[] = rows.map((row) => ({
      "Profit & Loss": row.pnl,
      "Reserve Amount": row.reserveAmountSum,
      time: row.endTime,
    }));

    return {
      unstakeAnalyticsData,
    };
  } catch (err) {
    console.error(err);
    return {
      unstakeAnalyticsData: [],
    };
  }
};
