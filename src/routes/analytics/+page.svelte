<script lang="ts">
  import type { PageData } from "./$types";
  import { DENOMS } from "$lib/resources/denoms";
  import { icon } from "$lib/resources/registry";
  import { formatBigNumber, getRelativeTime } from "$lib/wallet/utils";
  import BigNumber from "bignumber.js";
  import { Balance } from "$lib/wallet/coin";
  import { calculateIncompleteUnstakeEventPnL } from "$lib/analytics/utils";

  export let data: PageData;
  const { unstakeAnalyticsData, incompleteUnstakeAnalytics, vaultDebts } = data;
  const expectedUnstakeAnalytics = calculateIncompleteUnstakeEventPnL(
    incompleteUnstakeAnalytics,
    vaultDebts
  );

  let selectedController = "";
</script>

<div class="max-w-screen-lg mx-auto">
  <div class="flex flex-row justify-between w-full my-4 gap-7">
    <h1 class="text-2xl xs:text-3xl md:text-4xl">Analytics</h1>
  </div>
  <div class="flex flex-row gap-4">
    <div
      class="basis-1/2 rounded-lg border border-stone-500 max-h-72 overflow-y-scroll p-2"
    >
      <table class="w-full">
        <thead>
          <tr class="text-xs text-stone-500">
            <th class="text-left pt-2 pb-4"></th>
            <th class="text-left pt-2 pb-4">Time</th>
            <th class="text-left pt-2 pb-4">Unbond Amount</th>
            <th class="text-right pt-2 pb-4">NSTK PnL</th>
          </tr>
        </thead>
        <tbody>
          {#each unstakeAnalyticsData as unstake}
            {@const unbondAmount = Balance.fromAmountDenom(
              unstake.unbondAmount,
              unstake.controller.ask_denom
            )}
            {@const pnl = Balance.fromAmountDenom(
              unstake.pnl,
              unstake.controller.offer_denom
            )}
            <tr class="text-sm">
              <td>
                <svelte:component
                  this={icon(unstake.controller.ask_denom)}
                  class="size-5"
                />
              </td>
              <td>
                <div class="flex items-center gap-1 py-1">
                  {getRelativeTime(unstake.endTime, true)} ago
                </div>
              </td>
              <td class="">
                {unbondAmount.humanAmount(2)}
                <span class="text-stone-500">
                  {unbondAmount.name}
                </span>
              </td>
              <td class="text-right">
                {pnl.humanAmount(2)}
                <span class="text-stone-500">
                  {pnl.name}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <div
      class="basis-1/2 rounded-lg border border-stone-500 max-h-72 overflow-y-scroll p-2"
    >
      <table class="w-full">
        <thead>
          <tr class="text-xs text-stone-500">
            <th class="text-left pt-2 pb-4"></th>
            <th class="text-left pt-2 pb-4">Time</th>
            <th class="text-left pt-2 pb-4">Unbond Amount</th>
            <th class="text-right pt-2 pb-4">Forecasted PnL</th>
          </tr>
        </thead>
        <tbody>
          {#each expectedUnstakeAnalytics as unstake}
            {@const unbondAmount = Balance.fromAmountDenom(
              unstake.unbondAmount,
              unstake.controller.ask_denom
            )}
            {@const pnl = Balance.fromAmountDenom(
              unstake.pnl,
              unstake.controller.offer_denom
            )}
            <tr class="text-sm">
              <td>
                <svelte:component
                  this={icon(unstake.controller.ask_denom)}
                  class="size-5"
                />
              </td>
              <td>
                <div class="flex items-center gap-1 py-1">
                  {getRelativeTime(unstake.startTime, true)} ago
                </div>
              </td>
              <td class="">
                {unbondAmount.humanAmount(2)}
                <span class="text-stone-500">
                  {unbondAmount.name}
                </span>
              </td>
              <td class="text-right">
                {pnl.humanAmount(2)}
                <span class="text-stone-500">
                  {pnl.name}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
