import type { PageServerLoad } from "./$types";
import pkg from "pg";

import type {
  UnstakeAnalytics,
  IncompleteUnstakeAnalytics,
} from "$lib/analytics/types";
import { CONTROLLERS } from "@entropic-labs/unstake.js";
import { MAINNET } from "$lib/resources/networks";
import { HttpClient, Tendermint37Client } from "@cosmjs/tendermint-rpc";
import { env } from "$env/dynamic/private";
import { createKujiraClient } from "$lib/network/connect";

const postgresQuery = (db: pkg.PoolClient, text: string, params: string[]) =>
  db.query(text, params);

export const prerender = false;
export const ssr = true;

const rpcClient = env["RPC_kaiyo-1"] ? new HttpClient(env["RPC_kaiyo-1"]) : undefined;

export const load: PageServerLoad = async ({ locals }) => {
  const db = locals.db;
  const tmClient = await Tendermint37Client.create(rpcClient!);
  const client = await createKujiraClient(tmClient, MAINNET, env["RPC_kaiyo-1"]!);

  const allVaults = [...new Set(Object.values(CONTROLLERS[MAINNET] ?? {}).map((controller) => controller!.vault_address))];

  try {
    const vaultDebtRatios = Promise.all(allVaults.map(async (vault) => {
      const status = await client.wasm.queryContractSmart(vault, { status: {} })
      return [vault, status["debt_share_ratio"] as string];
    })).then((res) => Object.fromEntries(res) as Record<string, string>);

    // Query necessary data to calculate analytics for completed Unstake events
    const [completedEventAnalytics, startedEventAnalytics, vaultDebts] = await Promise.all([
      postgresQuery(
        db,
        `
        SELECT "endTime", "controller", "startTime", "protocolFee", "unbondAmount"
        FROM unstake
        WHERE (NOT "startBlockHeight"=0) AND (NOT "endBlockHeight"=0) AND (NOT "controller"='')
        ORDER BY "endTime" DESC
        LIMIT $1
        `,
        ["20"]
      ),
      // Query necessary data to calculate analytics for Unstake events that haven't ended
      postgresQuery(
        db,
        `
        SELECT "reserveAmount", "vaultDebt", "debtAmount", "providerRedemption", "unbondAmount",  "startTime", "controller"
        FROM unstake
        WHERE (NOT "startBlockHeight"=0) AND ("endBlockHeight"=0) AND (NOT "controller"='')
        ORDER BY "startTime" DESC
        LIMIT $1
        `,
        ["20"]
      ),
      // Query vault debts
      vaultDebtRatios,
    ]);

    const incompleteUnstakeAnalytics: IncompleteUnstakeAnalytics[] =
      startedEventAnalytics.rows.map((row) => ({
        debtAmount: row.debtAmount,
        providerRedemption: row.providerRedemption,
        reserveAmount: row.reserveAmount,
        startTime: row.startTime,
        unbondAmount: row.unbondAmount,
        vaultDebt: row.vaultDebt,
        controller: CONTROLLERS[MAINNET][row.controller]!,
      }));

    const unstakeAnalyticsData: UnstakeAnalytics[] =
      completedEventAnalytics.rows.map((row) => ({
        pnl: row.protocolFee,
        unbondAmount: row.unbondAmount,
        startTime: row.startTime,
        endTime: row.endTime,
        controller: CONTROLLERS[MAINNET][row.controller]!,
      }));
    return {
      unstakeAnalyticsData,
      incompleteUnstakeAnalytics,
      vaultDebts,
    };
  } catch (err) {
    console.error(err);
    return {
      unstakeAnalyticsData: [],
      incompleteUnstakeAnalytics: [],
      vaultDebts: {},
    };
  }
};
