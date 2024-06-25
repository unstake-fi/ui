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
import { BigNumber } from "bignumber.js";

const DAYS_14_MS = 14 * 24 * 60 * 60 * 1000;

// Generates PnL and Reserve Amount statistics for each controller that belongs to the current chainId
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

        if (acc[controller] == null) {
          acc[controller] = {
            controller,
            pnlData: [],
            offerDenom: nonNullOfferDenom,
            askDenom: nonNullAskDenom,
            frequency: [],
          };
        }

        const pnlDenominator = Math.pow(10, offerDenomInfo.dec);

        acc[controller].pnlData.push({
          x: currentAnalytics.startTime,
          y: currentAnalytics.pnl / pnlDenominator,
        });

        acc[controller].frequency.push({
          x: currentAnalytics.startTime,
          y: 1,
        });

        return acc;
      },
      {}
    )
  );
}

type ControllerVaultDebts = {
  [controller: string]: number;
};

// Gets controlled vault debts that are a part of the client's chain id
async function getControllerVaultDebts(
  controllers: string[],
  client: Refreshing<KujiraClient>
): Promise<ControllerVaultDebts> {
  const { chainId } = get(savedNetwork);
  let c = await get(client);
  if (c == null) return {};

  // Query unbondTime for each controller
  const controlledVaultDebts = (
    await Promise.all(
      controllers.map(async (controller) => {
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

// Returns the expected PnL and reserve amount for incomplete Unstake V0 and V1 events
function calculateExpectedAnalytics({
  controller,
  debtAmount,
  providerRedemption,
  reserveAmount,
  startTime,
  unbondAmount,
  vaultDebt,
  controllerVaultDebts,
}: IncompleteUnstakeAnalytics & {
  controllerVaultDebts: ControllerVaultDebts;
}): UnstakeAnalytics | null {
  const { chainId } = get(savedNetwork);

  const expectedReturn = BigNumber(providerRedemption).multipliedBy(
    BigNumber(unbondAmount)
  );

  // Make sure controller has a vault debt
  if (controllerVaultDebts[controller] == null) {
    return null;
  }

  const currentVaultDebt = controllerVaultDebts[controller];
  const debtRateDelta = BigNumber(currentVaultDebt).minus(BigNumber(vaultDebt));

  const splitDebtAmount = debtAmount.split("factory");
  const debtAmountNum = BigNumber(parseInt(splitDebtAmount[0]));
  const debtDuringUnstake =
    BigNumber(debtRateDelta).multipliedBy(debtAmountNum);
  const debtBeforeUnstake = debtAmountNum.multipliedBy(BigNumber(vaultDebt));

  const unbondTimeMs =
    CONTROLLERS[chainId][controller]?.broker.duration || DAYS_14_MS;

  const totalDebt = debtDuringUnstake.plus(debtBeforeUnstake);
  const expectedPnl = expectedReturn
    .minus(totalDebt)
    .minus(BigNumber(reserveAmount));

  return {
    pnl: expectedPnl.toNumber(),
    startTime: startTime,
    endTime: new Date(startTime.getTime() + unbondTimeMs),
    controller,
  };
}

function calculateV1Analytics({
  controller,
  debtAmount,
  providerRedemption,
  reserveAmount,
  startTime,
  unbondAmount,
  vaultDebt,
  controllerVaultDebts,
}: IncompleteUnstakeAnalytics & {
  controllerVaultDebts: ControllerVaultDebts;
}): UnstakeAnalytics | null {
  const { chainId } = get(savedNetwork);

  const expectedReturn = BigNumber(providerRedemption).multipliedBy(
    BigNumber(unbondAmount)
  );

  // Make sure controller has a vault debt
  if (controllerVaultDebts[controller] == null) {
    return null;
  }

  const currentVaultDebt = controllerVaultDebts[controller];
  const debtRateDelta = BigNumber(currentVaultDebt).minus(BigNumber(vaultDebt));

  const splitDebtAmount = debtAmount.split("factory");
  const debtAmountNum = BigNumber(parseInt(splitDebtAmount[0]));
  const debtDuringUnstake =
    BigNumber(debtRateDelta).multipliedBy(debtAmountNum);
  const debtBeforeUnstake = debtAmountNum.multipliedBy(BigNumber(vaultDebt));

  const unbondTimeMs =
    CONTROLLERS[chainId][controller]?.broker.duration || DAYS_14_MS;

  const totalDebt = debtDuringUnstake.plus(debtBeforeUnstake);
  const expectedPnl = expectedReturn
    .minus(totalDebt)
    .minus(BigNumber(reserveAmount));

  return {
    pnl: expectedPnl.toNumber(),
    startTime: startTime,
    endTime: new Date(startTime.getTime() + unbondTimeMs),
    controller,
  };
}

// Calculates PnL for unstake events with controllers belonging to the client's chain id
export async function calculateIncompleteUnstakeEventPnL(
  incompleteUnstakeAnalytics: IncompleteUnstakeAnalytics[],
  client: Refreshing<KujiraClient>
): Promise<UnstakeAnalytics[]> {
  const uniqueControllers = uniqueList(
    incompleteUnstakeAnalytics.map((value) => value.controller)
  );

  const controllerVaultDebts = await getControllerVaultDebts(
    uniqueControllers,
    client
  );

  // Calculate expected PnL
  return mapNonNull(incompleteUnstakeAnalytics, (incompleteUnstakeAnalytic) =>
    calculateExpectedAnalytics({
      ...incompleteUnstakeAnalytic,
      controllerVaultDebts,
    })
  );
}

function uniqueList<T>(list: T[]) {
  return [...new Set(list)];
}

function mapNonNull<S, T>(list: S[], func: (data: S, idx: number) => T | null) {
  return list.map(func).filter((d) => d != null);
}
