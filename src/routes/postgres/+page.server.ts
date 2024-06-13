import { query } from "$lib/postgres";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  try {
    // TODO: use interest rates
    const protocolHealthResult = await query('SELECT "reserveAmount", ("returnAmount" - "repayAmount" - "reserveAmount") as pnl FROM unstake', []);
    
    return {
      data: protocolHealthResult.rows,
    };
  } catch (err) {
    console.error(err);
    return {
      data: [],
    };
  }
};
