<script lang="ts">
  import { onMount } from "svelte";
  import Chart from "chart.js/auto";
  import "chartjs-adapter-moment";
  import { type DateLineChartData, TimeRange } from "./types";
  import { getTooltipFormat } from "./utils";

  export let chartData: DateLineChartData[];
  export let datasetLabel: string;
  export let yLabel: string;
  export let unit: string;
  export let graphColor: string;
  export let timeRange: TimeRange;

  let chart: Chart<any, DateLineChartData[], unknown> | null;
  let portfolio: HTMLCanvasElement | null;

  const data = {
    datasets: [
      {
        label: datasetLabel,
        backgroundColor: graphColor,
        borderColor: graphColor,
        fill: false,
        data: chartData,
      },
    ],
  };

  // TODO: show decimal as a part of tooltip
  const config = {
    type: "line",
    data,
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context: any) {
              return `${context.parsed.y} ${unit}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: "time",
          grid: {
            color: "#44403C",
          },
          time: {
            tooltipFormat: getTooltipFormat(timeRange),
          },
          title: {
            display: true,
            text: "Date",
          },
        },
        y: {
          grid: {
            color: "#44403C",
          },
          title: {
            display: true,
            text: yLabel,
          },
        },
      },
    },
  } as const;

  onMount(() => {
    if (portfolio == null) {
      return;
    }
    const ctx = portfolio.getContext("2d");
    if (ctx == null) {
      return;
    }
    Chart.defaults.color = "#78716C";
    chart = new Chart(ctx, config);
  });

  $: if (chartData) {
    if (chart != null) {
      chart.data.datasets[0].data = chartData;
      chart.data.datasets[0].borderColor = graphColor;
      chart.data.datasets[0].backgroundColor = graphColor;
      chart.options.scales = {
        x: {
          type: "time",
          grid: {
            color: "#44403C",
          },
          time: {
            tooltipFormat: getTooltipFormat(timeRange),
          },
          title: {
            display: true,
            text: "Date",
          },
        },
        y: {
          grid: {
            color: "#44403C",
          },
          title: {
            display: true,
            text: yLabel,
          },
        },
      };
      chart.update();
    }
  }
</script>

<canvas bind:this={portfolio} width={300} height={300} />
