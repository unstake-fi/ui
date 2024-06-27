<script lang="ts">
  import "chartjs-adapter-moment";
  import { type DateLineChartData, TimeRange } from "./types";
  import { aggregateDataByDates, getNearestDate, getRangeText } from "./utils";
  import { ArrowDown, ArrowUp } from "lucide-svelte";
  import DateLineChart from "./DateLineChart.svelte";
  import { icon } from "$lib/resources/registry";

  export let chartData: DateLineChartData[];
  export let datasetLabel: string;
  export let yLabel: string;
  export let unit: string;
  export let digitsToRound: number = 6;
  export let shouldShowKeepFutureToggle = false;
  export let iconDenom: string | undefined = undefined;
  export let footerComment = "";
  export let verticalLineIdx = 0;

  let timeRange: TimeRange = TimeRange["5D"];
  let aggregatedDates: DateLineChartData[] = [];
  let graphColor = "gray";
  let earliestValue = 0;
  let totalValue = 0;
  let difference = 0;
  let timeDifference = 0;
  let shouldKeepFuture = false;

  function updateGraph() {
    aggregatedDates = aggregateDataByDates({
      chartData,
      timeRange,
      shouldKeepFuture,
    });
    timeDifference =
      aggregatedDates[aggregatedDates.length - 1].x.getTime() -
      aggregatedDates[0].x.getTime();

    const currentNearestDate = getNearestDate(new Date(), timeRange);
    verticalLineIdx = aggregatedDates
      .map((date, idx) => ({
        x: Math.abs(currentNearestDate.getTime() - date.x.getTime()),
        idx,
      }))
      .toSorted((a, b) => a.x - b.x)[0].idx;

    earliestValue = aggregatedDates[0].y;
    let latestValue = aggregatedDates[aggregatedDates.length - 1].y;
    totalValue = aggregatedDates.reduce((acc, curr) => acc + curr.y, 0);
    difference = latestValue - earliestValue;
    graphColor =
      difference === 0 ? "gray" : difference > 0 ? "#15803d" : "#B91C1C";
  }

  function setTimeRange(newTimeRange: TimeRange) {
    timeRange = newTimeRange;
    updateGraph();
  }

  function toggleShouldKeepFuture() {
    shouldKeepFuture = !shouldKeepFuture;
    updateGraph();
  }

  updateGraph();
</script>

<div
  class="flex flex-1 bg-stone-800 rounded-lg py-2 px-2.5 flex-col justify-start"
>
  <p class="text-md text-stone-400">{datasetLabel}</p>

  <div class="flex gap-1 items-center">
    <p class="text-lg bold font-semibold">
      {totalValue.toFixed(digitsToRound)}<span class="font-normal"
        >{" "}{unit}
      </span>
    </p>
    {#if iconDenom != null}
      <svelte:component this={icon(iconDenom)} class="h-6 w-6" />
    {/if}
  </div>

  <p
    class={`text-sm ${
      difference === 0
        ? "text-stone-400"
        : difference > 0
          ? "text-green-600"
          : "text-[#c03232]"
    }`}
  >
    {difference.toFixed(digitsToRound)} ({earliestValue !== 0
      ? ((difference / earliestValue) * 100).toFixed(2)
      : "-"}%)
    {#if difference > 0}
      <ArrowUp class="inline" />
    {:else if difference < 0}
      <ArrowDown class="inline" />{/if}
    {" "}{getRangeText(timeRange, timeDifference)}
  </p>
  <div class="flex">
    <button
      class={`${timeRange === TimeRange["1D"] ? "text-blue-500 underline" : "text-stone-400"} border-x-2 px-2 border-stone-400`}
      on:click={() => setTimeRange(TimeRange["1D"])}>1D</button
    >
    <button
      class={`${timeRange === TimeRange["5D"] ? "text-blue-500 underline" : "text-stone-400"} border-r-2 px-2 border-stone-400`}
      on:click={() => setTimeRange(TimeRange["5D"])}>5D</button
    >
    <button
      class={`${timeRange === TimeRange["2W"] ? "text-blue-500 underline" : "text-stone-400"} border-r-2 px-2 border-stone-400`}
      on:click={() => setTimeRange(TimeRange["2W"])}>2W</button
    >
    <button
      class={`${timeRange === TimeRange["6M"] ? "text-blue-500 underline" : "text-stone-400"} border-r-2 px-2 border-stone-400`}
      on:click={() => setTimeRange(TimeRange["6M"])}>6M</button
    >
    <button
      class={`${timeRange === TimeRange["1Y"] ? "text-blue-500 underline" : "text-stone-400"} border-r-2 px-2 border-stone-400`}
      on:click={() => setTimeRange(TimeRange["1Y"])}>1Y</button
    >
    <button
      class={`${timeRange === TimeRange["MAX"] ? "text-blue-500 underline" : "text-stone-400"} border-r-2 px-2 border-stone-400`}
      on:click={() => setTimeRange(TimeRange["MAX"])}>MAX</button
    >
  </div>

  <DateLineChart
    chartData={aggregatedDates}
    {datasetLabel}
    {yLabel}
    {unit}
    {graphColor}
    {timeRange}
    {verticalLineIdx}
  />
  {#if shouldShowKeepFutureToggle}
    <label class="inline-flex items-center cursor-pointer justify-center">
      <input
        type="checkbox"
        value=""
        class="sr-only peer"
        on:click={toggleShouldKeepFuture}
      />
      <div
        class="relative w-11 h-6 bg-stone-500 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
      ></div>
      <span class="ms-3 text-sm font-medium text-stone-400"
        >Show Future {datasetLabel}</span
      >
    </label>
  {/if}
  {#if footerComment !== ""}
    <span class="mt-2 text-sm italic text-stone-400 text-center"
      >{footerComment}</span
    >
  {/if}
</div>
