import { CONTROLLERS } from "@entropic-labs/unstake.js";
import type {
  ControllerAnalytics,
  IncompleteUnstakeAnalytics,
  UnstakeAnalytics,
} from "./types";
import { get } from "svelte/store";
import { DENOMS } from "$lib/resources/denoms";
import { savedNetwork } from "$lib/network/stores";
import type { KujiraClient } from "$lib/network/types";
import type { Refreshing } from "$lib/refreshing";

export function gatherUnstakeAnalyticsByController(
  unstakeAnalyticsData: UnstakeAnalytics[]
) {
  const { chainId } = get(savedNetwork);
  const VALID_CONTROLLERS = CONTROLLERS[chainId];

  return Object.values(
    unstakeAnalyticsData.reduce(
      (acc: { [key: string]: ControllerAnalytics }, currentAnalytics) => {
        const controller: string = currentAnalytics.controller;
        // Filter out data that doesn't belong to chain
        if (VALID_CONTROLLERS[controller] == null) {
          return acc;
        }

        // Apply denomination
        const nonNullOfferDenom =
          VALID_CONTROLLERS[controller]?.offer_denom || "";
        const nonNullAskDenom = VALID_CONTROLLERS[controller]?.ask_denom || "";

        const offerDenomInfo = DENOMS[nonNullOfferDenom];
        const askDenomInfo = DENOMS[nonNullAskDenom];

        if (acc[controller] == null) {
          acc[controller] = {
            controller,
            pnlData: [],
            reserveData: [],
            offerDenom: offerDenomInfo.name,
            askDenom: askDenomInfo.name,
          };
        }

        const pnlDenominator = Math.pow(10, offerDenomInfo.dec);
        const reserveAmountDenominator = Math.pow(10, askDenomInfo.dec);

        acc[controller].pnlData.push({
          x: currentAnalytics.time,
          y: currentAnalytics["Profit & Loss"] / pnlDenominator,
        });

        acc[controller].reserveData.push({
          x: currentAnalytics.time,
          y: currentAnalytics["Reserve Amount"] / reserveAmountDenominator,
        });
        return acc;
      },
      {}
    )
  );
}

async function getControlledVaultDebts(
  incompleteUnstakeAnalytics: IncompleteUnstakeAnalytics[],
  client: Refreshing<KujiraClient>
) {
  const { chainId } = get(savedNetwork);
  let c = await get(client);
  if (c == null) return {};

  // Query unbondTime for each controller
  const uniqueControllers = uniqueList(
    incompleteUnstakeAnalytics.map((value) => value.controller)
  );

  const controlledVaultDebts = (
    await Promise.all(
      uniqueControllers.map(async (controller) => {
        const controllerAddress =
          CONTROLLERS[chainId][controller]?.vault_address;

        if (controllerAddress == null) {
          return null;
        }

        let status = await c.wasm.queryContractSmart(controllerAddress, {
          status: {},
        });

        const currentVaultDebt: number = status["debt_share_ratio"];

        return { controller, currentVaultDebt };
      }, {})
    )
  ).reduce((acc: { [controller: string]: number }, data) => {
    if (data == null) {
      return acc;
    }

    const { controller, currentVaultDebt } = data;

    const newAcc = {
      ...acc,
    };

    newAcc[controller] = currentVaultDebt;
    return newAcc;
  }, {});

  return controlledVaultDebts;
}

export async function calculateIncompleteUnstakeEventPnL(
  incompleteUnstakeAnalytics: IncompleteUnstakeAnalytics[],
  client: Refreshing<KujiraClient>
): Promise<UnstakeAnalytics[]> {
  const controlledVaultDebts = await getControlledVaultDebts(
    incompleteUnstakeAnalytics,
    client
  );

  // Calculate expected PnL
  return mapNonNull(
    incompleteUnstakeAnalytics,
    ({
      controller,
      debtAmount,
      providerRedemption,
      reserveAmount,
      startTime,
      unbondAmount,
      vaultDebt,
    }) => {
      const expectedReturn = providerRedemption * unbondAmount;

      // Make sure controller has a vault debt
      if (controlledVaultDebts[controller] == null) {
        return null;
      }

      const currentVaultDebt = controlledVaultDebts[controller];
      const debtRateDelta = currentVaultDebt - vaultDebt;

      const splitDebtAmount = debtAmount.split("factory");
      const debtAmountSoFar = debtRateDelta * parseInt(splitDebtAmount[0]);

      // TODO: replace with more accurate unbonding time
      const unbondTimeMs = 14 * 24 * 60 * 60 * 1000;

      const expectedDebt = debtAmountSoFar;
      const expectedPnl = expectedReturn - expectedDebt - reserveAmount;

      return {
        "Profit & Loss": expectedPnl,
        "Reserve Amount": reserveAmount,
        time: new Date(startTime.getTime() + unbondTimeMs),
        controller,
      };
    }
  );
}

function uniqueList<T>(list: T[]) {
  return [...new Set(list)];
}

function mapNonNull<S, T>(list: S[], func: (data: S, idx: number) => T | null) {
  return list.map(func).filter((d) => d != null);
}
