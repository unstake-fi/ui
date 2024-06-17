<script lang="ts">
  import { onMount } from "svelte";
  import Chart from "chart.js/auto";
  import "chartjs-adapter-moment";
  import type { DateLineChartData, TimeRange } from "./types";
  import { msInRange } from "./utils";

  export let chartData: DateLineChartData[];
  export let timeRange: TimeRange;

  let portfolio: HTMLCanvasElement;

  const data = {
    datasets: [
      {
        label: "Profit & Loss",
        backgroundColor: "green",
        borderColor: "green",
        fill: false,
        data: chartData,
      },
    ],
  };

  const config = {
    type: "line",
    data: data,
    options: {
      plugins: {},
      scales: {
        x: {
          type: "time",
          time: {
            tooltipFormat: "M/D/Y h:mm:ss A",
          },
          min: new Date(Date.now() - msInRange(timeRange)),
          title: {
            display: true,
            text: "Date",
          },
        },
        y: {
          title: {
            display: true,
            text: "Value (KUJI)",
          },
        },
      },
    },
  };
  onMount(() => {
    const ctx = portfolio.getContext("2d");
    // Initialize chart using default config set
    if (ctx != null) {
      new Chart(ctx, config);
    }
  });
</script>

<canvas bind:this={portfolio} width={400} height={400} />
