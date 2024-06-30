import { CONTROLLERS } from "@entropic-labs/unstake.js";
import type {
  ControllerAnalytics,
  IncompleteUnstakeAnalytics,
  UnstakeAnalytics,
  VaultDebts,
} from "./types";
import { get } from "svelte/store";
import { DENOMS } from "$lib/resources/denoms";
import { savedNetwork } from "$lib/network/stores";
import { BigNumber } from "bignumber.js";

// Generates PnL and Reserve Amount statistics for each controller that belongs to the current chainId
export function gatherUnstakeAnalyticsByController(
  unstakeAnalyticsData: UnstakeAnalytics[]
) {
  const { chainId } = get(savedNetwork);
  const VALID_CONTROLLERS = CONTROLLERS[chainId];

  return Object.values(
    unstakeAnalyticsData.reduce(
      (acc: { [key: string]: ControllerAnalytics }, currentAnalytics) => {
        const controller = currentAnalytics.controller;
        // Apply denomination
        const nonNullOfferDenom = controller.offer_denom;
        const nonNullAskDenom = controller.ask_denom;

        const offerDenomInfo = DENOMS[nonNullOfferDenom];

        if (acc[controller.address] == null) {
          acc[controller.address] = {
            controller: controller.address,
            pnlData: [],
            offerDenom: nonNullOfferDenom,
            askDenom: nonNullAskDenom,
            frequency: [],
          };
        }

        const pnlDenominator = Math.pow(10, offerDenomInfo.dec);

        acc[controller.address].pnlData.push({
          x: currentAnalytics.endTime,
          y: new BigNumber(currentAnalytics.pnl).dividedBy(pnlDenominator).toNumber(),
        });

        acc[controller.address].frequency.push({
          x: currentAnalytics.startTime,
          y: 1,
        });

        return acc;
      },
      {}
    )
  );
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
  vaultDebtRates,
}: IncompleteUnstakeAnalytics & {
  vaultDebtRates: VaultDebts;
}): UnstakeAnalytics | null {
  if (!controller) return null;
  const { chainId } = get(savedNetwork);
  const expectedReturn = BigNumber(providerRedemption).multipliedBy(
    BigNumber(unbondAmount)
  );

  // Make sure controller has a vault debt
  const currentVaultDebt = vaultDebtRates[controller.vault_address];
  if (!currentVaultDebt) {
    return null;
  }

  const debtRateDelta = BigNumber(currentVaultDebt).minus(BigNumber(vaultDebt));

  const splitDebtAmount = debtAmount.split("factory");
  const debtAmountNum = BigNumber(splitDebtAmount[0]);
  const debtDuringUnstake =
    BigNumber(debtRateDelta).multipliedBy(debtAmountNum);
  const debtBeforeUnstake = debtAmountNum.multipliedBy(BigNumber(vaultDebt));

  const unbondTimeMs = controller.broker.duration * 1000;

  const totalDebt = debtDuringUnstake.plus(debtBeforeUnstake);
  const expectedPnl = expectedReturn
    .minus(totalDebt)
    .minus(BigNumber(reserveAmount));

  return {
    pnl: expectedPnl.toString(),
    unbondAmount: unbondAmount,
    startTime: startTime,
    endTime: new Date(startTime.getTime() + unbondTimeMs),
    controller,
  };
}

// Calculates PnL for unstake events with controllers belonging to the client's chain id
export function calculateIncompleteUnstakeEventPnL(
  incompleteUnstakeAnalytics: IncompleteUnstakeAnalytics[],
  vaultDebtRates: VaultDebts
): UnstakeAnalytics[] {
  // Calculate expected PnL
  return mapNonNull(incompleteUnstakeAnalytics, (incompleteUnstakeAnalytic) =>
    calculateExpectedAnalytics({
      ...incompleteUnstakeAnalytic,
      vaultDebtRates,
    })
  );
}

function mapNonNull<S, T>(list: S[], func: (data: S, idx: number) => T | null): T[] {
  const filterNull = (d: T | null): d is T => d != null;
  return list.map(func).filter(filterNull);
}
