<script lang="ts">
  import "chartjs-adapter-moment";
  import { type DateLineChartData, TimeRange } from "./types";
  import { aggregateDataByDates, getRangeText } from "./utils";
  import { ArrowDown, ArrowUp } from "lucide-svelte";
  import DateLineChart from "./DateLineChart.svelte";

  export let chartData: DateLineChartData[];
  export let datasetLabel: string;
  export let yLabel: string;
  export let unit: string;
  export let digitsToRound: number = 6;

  let timeRange: TimeRange = TimeRange["5D"];
  let aggregatedDates: DateLineChartData[] = [];
  let graphColor = "gray";
  let earliestValue = 0;
  let totalValue = 0;
  let difference = 0;

  function updateGraph() {
    aggregatedDates = aggregateDataByDates(chartData, timeRange);
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

  updateGraph();
</script>

<div
  class="flex flex-1 bg-stone-800 rounded-lg py-2 px-2.5 flex-col justify-start"
>
  <p class="text-md text-stone-400">{datasetLabel}</p>
  <p class="text-lg bold font-semibold">
    {totalValue.toFixed(digitsToRound)}<span class="font-normal"
      >{" "}{unit}</span
    >
  </p>
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
      ? ((difference / earliestValue) * 100).toFixed(digitsToRound)
      : "-"}%)
    {#if difference > 0}
      <ArrowUp class="inline" />
    {:else if difference < 0}
      <ArrowDown class="inline" />{/if}
    {" "}{getRangeText(timeRange)}
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
    verticalLineIdx={aggregatedDates.length-1}
  />
</div>
