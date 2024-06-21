<script lang="ts">
  import { client, savedNetwork } from "$lib/network/stores";
  import { refreshing } from "$lib/refreshing";
  import {
    RESERVES,
    type ReserveStatusResponse,
  } from "$lib/resources/registry";
  import { Balance } from "$lib/wallet/coin";
  import { get } from "svelte/store";
  import { BigNumber } from "bignumber.js";
  import ReserveWidget from "$lib/components/reserve/ReserveWidget.svelte";
  import WalletInfo from "$lib/components/WalletInfo.svelte";
  import ReserveMigration from "$lib/components/ReserveMigration.svelte";
  import type { PageData } from "./$types";
  import DateLineChartWrapper from "$lib/graph/DateLineChartWrapper.svelte";
  import {
    calculateIncompleteUnstakeEventPnL,
    gatherUnstakeAnalyticsByController,
  } from "$lib/analytics/utils";

  export let data: PageData = {
    unstakeAnalyticsData: [],
    incompleteUnstakeAnalytics: [],
  };

  $: allReserves = Object.values(RESERVES[$savedNetwork.chainId]);

  const allControllerAnalytics = refreshing(
    async () => {
      const incompleteUnstakeEventAnalyticsData =
        await calculateIncompleteUnstakeEventPnL(
          data.incompleteUnstakeAnalytics,
          client
        );

      console.log(data.unstakeAnalyticsData);
      console.log(incompleteUnstakeEventAnalyticsData);

      const unstakeEventAnalytics = gatherUnstakeAnalyticsByController([
        ...data.unstakeAnalyticsData,
        ...incompleteUnstakeEventAnalyticsData,
      ]);

      return unstakeEventAnalytics;
    },
    {
      refreshOn: [client],
    }
  );

  const reserveStatuses = refreshing(
    async () => {
      let c = await get(client);
      if (!c) return {};

      let statuses = await Promise.all(
        allReserves.map(async (reserve) => {
          let status = await c.wasm.queryContractSmart(reserve.address, {
            status: {},
          });

          status.available = Balance.fromAmountDenom(
            status.available,
            reserve.baseDenom
          );
          status.total = Balance.fromAmountDenom(
            status.total,
            reserve.baseDenom
          );
          status.deployed = Balance.fromAmountDenom(
            status.deployed,
            reserve.baseDenom
          );
          status.reserve_redemption_rate = new BigNumber(
            status.reserve_redemption_rate
          );
          return [reserve.address, status] as [string, ReserveStatusResponse];
        })
      );
      return Object.fromEntries(statuses);
    },
    {
      refreshOn: [client],
    }
  );
</script>

<div class="max-w-prose mx-auto">
  <div class="mb-4">
    <ReserveMigration />
  </div>
  <div class="flex items-center justify-between w-full mb-4 gap-4">
    <h1 class="text-2xl xs:text-3xl md:text-4xl text-center">
      Protocol Reserves
    </h1>
    <WalletInfo />
  </div>
</div>
<div
  class="flex flex-col max-w-screen-md mx-auto items-stretch xs:items-start w-full xs:w-fit"
>
  <div
    class="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 text-stone-200 w-full xs:w-fit"
  >
    {#each allReserves as reserve}
      {@const status = $reserveStatuses.then((stats) => stats[reserve.address])}
      <ReserveWidget
        {status}
        {reserve}
        query={reserveStatuses}
        class="basis-1/3 mx-4 xs:mx-0"
      />
    {/each}
  </div>
</div>

<div class="max-w-prose mx-auto">
  <div class="flex flex-col justify-center w-full my-4 gap-4">
    <h1 class="text-2xl xs:text-3xl md:text-4xl">Analytics</h1>
  </div>
</div>

{#await $allControllerAnalytics then completeControllerAnalytics}
  {#if completeControllerAnalytics.length > 0}
    <div
      class="flex w-full items-center justify-center align-center flex-col gap-4 mb-10"
    >
      {#each completeControllerAnalytics as controllerAnalytics}
        <div
          class="flex gap-4 items-center justify-center align-center flex-col md:flex-row"
        >
          <DateLineChartWrapper
            chartData={controllerAnalytics.frequency}
            datasetLabel={"Unstake Frequency"}
            yLabel={`Frequency`}
            unit={"Events"}
            digitsToRound={0}
          />
          <DateLineChartWrapper
            chartData={controllerAnalytics.pnlData}
            datasetLabel={"Profit & Loss"}
            yLabel={`Value ${controllerAnalytics.askDenom}`}
            unit={controllerAnalytics.askDenom}
          />
          <DateLineChartWrapper
            chartData={controllerAnalytics.reserveData}
            datasetLabel={"Reserve Amounts"}
            yLabel={`Value ${controllerAnalytics.offerDenom}`}
            unit={controllerAnalytics.offerDenom}
          />
        </div>
      {/each}
    </div>
  {:else}
    <div class="max-w-prose mx-auto">
      <div class="flex flex-col justify-center w-full my-4 gap-4">
        <p class="text-left">No analytics are available.</p>
      </div>
    </div>
  {/if}
{/await}
