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
  import DateLineChart from "$lib/components/graph/DateLineChart.svelte";
  import { ArrowUp } from "lucide-svelte";
  import sampleData from "./data.json";
  import { TimeRange } from "$lib/components/graph/types";
  import LineChart from "$lib/components/graph/LineChart.svelte";

  // TODO: Make graph range toggable
  let graphTimeRange = TimeRange.MAX;

  const formattedSampleData = sampleData.map((d) => ({
    ...d,
    time: new Date(d.time),
  }));

  let data: PageData = {
    unstakeAnalyticsData: formattedSampleData,
  };

  const pnlData = data.unstakeAnalyticsData.map((analytics) => ({
    x: analytics.time,
    y: analytics["Profit & Loss"]
  }));

  $: allReserves = Object.values(RESERVES[$savedNetwork.chainId]);

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

<div class="flex w-full gap-2 items-center max justify-center flex-col">
  <div
    class="flex flex-1 max-w-xl bg-stone-800 rounded-lg py-2 px-2.5 flex-col justify-start"
  >
    <p class="text-md text-stone-400">Profit & Loss</p>
    <p class="text-lg bold font-semibold">
      998.50 <span class="font-normal">KUJI</span>
    </p>
    <p class="text-sm text-green-600">
      +26.45 (14.25%) <ArrowUp class="inline" /> year to date
    </p>
    <!-- <DateLineChart
      data={pnlData}
      yVarTitle={"Profit & Loss"}
      chartWidth={500}
      chartHeight={400}
      {graphRange}
    /> -->
    <LineChart chartData={pnlData} timeRange={graphTimeRange}/>
  </div>
</div>
