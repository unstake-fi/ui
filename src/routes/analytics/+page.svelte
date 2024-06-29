<script lang="ts">
  import { client } from "$lib/network/stores";
  import { refreshing } from "$lib/refreshing";
  import type { PageData } from "./$types";
  import DateLineChartWrapper from "$lib/graph/DateLineChartWrapper.svelte";
  import {
    calculateIncompleteUnstakeEventPnL,
    gatherUnstakeAnalyticsByController,
  } from "$lib/analytics/utils";
  import { DENOMS } from "$lib/resources/denoms";

  export let data: PageData = {
    unstakeAnalyticsData: [],
    incompleteUnstakeAnalytics: [],
  };

  let selectedController = "";

  const allControllerAnalytics = refreshing(
    async () => {
      const incompleteUnstakeEventAnalyticsData =
        await calculateIncompleteUnstakeEventPnL(
          data.incompleteUnstakeAnalytics,
          client
        );

      const unstakeEventAnalytics = gatherUnstakeAnalyticsByController([
        ...data.unstakeAnalyticsData,
        ...incompleteUnstakeEventAnalyticsData,
      ]);

      if (unstakeEventAnalytics.length > 0) {
        selectedController = unstakeEventAnalytics[0].controller;
      }

      return unstakeEventAnalytics;
    },
    {
      refreshOn: [client],
    }
  );
</script>

<div class="max-w-prose mx-auto">
  <div class="flex flex-row justify-between w-full my-4 gap-7">
    <h1 class="text-2xl xs:text-3xl md:text-4xl">Analytics</h1>
    {#await $allControllerAnalytics then completeControllerAnalytics}
      {#if completeControllerAnalytics.length > 0}
        <select
          class="text-right bg-neutral-800 border-[#525252] border text-md focus:ring-blue-500 focus:border-blue-500 rounded px-1 py-2"
          name="pets"
          id="denom-select"
          bind:value={selectedController}
        >
          {#each completeControllerAnalytics as controllerAnalytics}
            <option value={controllerAnalytics.controller}>
              {DENOMS[controllerAnalytics.askDenom].name} → {DENOMS[
                controllerAnalytics.offerDenom
              ].name}
            </option>
          {/each}
        </select>
      {/if}
    {/await}
  </div>
</div>

{#await $allControllerAnalytics then completeControllerAnalytics}
  {#if completeControllerAnalytics.length > 0}
    {#if selectedController === ""}
      <div class="max-w-prose mx-auto">
        <div class="flex flex-row justify-start w-full my-4 gap-4">
          <p class="text-left">Please select a denomination.</p>
        </div>
      </div>
    {/if}
    <div
      class="flex w-full items-center justify-center align-center flex-col gap-4 mb-10"
    >
      {#each completeControllerAnalytics as controllerAnalytics}
        {#if controllerAnalytics.controller === selectedController}
          <div
            class="flex gap-4 items-center justify-center flex-col lg:flex-row"
          >
            <DateLineChartWrapper
              chartData={controllerAnalytics.frequency}
              datasetLabel={`Unstake Frequency`}
              yLabel={`Frequency`}
              unit={"Unstakings"}
              digitsToRound={0}
            />
            <DateLineChartWrapper
              chartData={controllerAnalytics.pnlData}
              datasetLabel={`Profit & Loss`}
              yLabel={`Value ${DENOMS[controllerAnalytics.offerDenom].name}`}
              unit={DENOMS[controllerAnalytics.offerDenom].name}
              iconDenom={controllerAnalytics.offerDenom}
              shouldShowKeepFutureToggle
            />
          </div>
        {/if}
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
