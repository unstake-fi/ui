<script lang="ts">
  import { scaleLinear, scaleUtc } from "d3-scale";
  import Tick from "./Tick.svelte";
  import DateTooltip from "./DateTooltip.svelte";
  import { extent } from "d3";
  import type { DateLineChartData, Range } from "./types";

  const paddings = {
    top: 20,
    left: 50,
    right: 50,
    bottom: 50,
  };

  const DEFAULT_DATA: DateLineChartData = {
    time: new Date(),
    y: 0,
  };

  export let chartWidth: number;
  export let chartHeight: number;
  export let graphRange: Range;
  const tickNumber = chartWidth > 480 ? 10 : 2;

  export let data: DateLineChartData[];

  function msInRange(range: Range) {
    switch (range) {
      case "1D":
        return 86400000;
      case "5D":
        return 432000000;
      case "6M":
        return 15778800000;
      case "1Y":
        return 31557600000;
      case "MAX":
        return Date.now();
    }
  }

  function getClosestDate(date: Date, range: Range) {
    const newDate = new Date(date.getTime());
    switch (range) {
      case "1D":
      case "5D":
        newDate.setHours(0);
        newDate.setMinutes(0);
        newDate.setMilliseconds(0);
        return newDate;
      case "6M":
      case "1Y":
      case "MAX":
        newDate.setHours(0);
        newDate.setMinutes(0);
        newDate.setMilliseconds(0);
        newDate.setDate(0);
        return newDate;
    }
  }

  function filterData(
    dateLineChartData: DateLineChartData[]
  ): DateLineChartData[] {
    const range = "1Y";

    // Convert to local timezone
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localTimeZoneData: DateLineChartData[] = dateLineChartData.map(
      (d) => ({
        y: d.y,
        time: new Date(d.time.toLocaleString("en-US", { timeZone })),
      })
    );

    // Remove dates that aren't within range
    const withinRangeData = localTimeZoneData.filter(
      (d) => Math.abs(d.time.getTime() - Date.now()) <= msInRange(range)
    );

    // Aggregate data based on closest date
    const roundedDates = withinRangeData.map((d) => ({
      y: d.y,
      time: getClosestDate(d.time, range),
    }));

    const aggregatedDates = Object.values(roundedDates.reduce(
      (acc: { [key: string]: DateLineChartData }, current) => {
        const timeKey = current.time.toISOString();

        if (acc[timeKey] == null) {
          acc[timeKey] = { y: 0, time: current.time };
        }
        acc[timeKey].y += current.y;

        return acc;
      },
      {}
    )).sort((a, b) => a.time.getTime() - b.time.getTime());

    return aggregatedDates;
  }

  const filteredData = filterData(data);

  // TODO: make this type more specific with generics
  export let yVarTitle: string;

  const minMax = extent(filteredData, (d) => d.time);

  const xScale = scaleUtc(minMax[0] === undefined ? [0, 0] : minMax, [
    paddings.left,
    chartWidth - paddings.right,
  ]);

  const yScale = scaleLinear()
    .domain([
      Math.min(...filteredData.map((d) => d.y)),
      Math.max(...filteredData.map((d) => d.y)),
    ])
    .range([chartHeight - paddings.bottom, paddings.top])
    .nice(tickNumber);

  const yGrid = yScale.ticks(tickNumber);
  const xGrid = xScale.ticks(3);

  const getLineColor = () => {
    return "#4daf4a";
    // TODO: update to red (#e41a1c) on decreasing trend
  };

  const idContainer = "svg-container-" + Math.random() * 1000000;
  let mousePosition: { x: number | null; y: number | null } = {
    x: null,
    y: null,
  };

  function followMouse(event: MouseEvent) {
    const svg = document.getElementById(idContainer);
    if (svg === null) return;

    const dim = svg.getBoundingClientRect();
    const positionInSVG = {
      x: event.clientX - dim.left,
      y: event.clientY - dim.top,
    };

    mousePosition =
      positionInSVG.x > paddings.left &&
      positionInSVG.x < chartWidth - paddings.right &&
      positionInSVG.y > paddings.top &&
      positionInSVG.y < chartHeight - paddings.bottom
        ? { x: positionInSVG.x, y: positionInSVG.y }
        : { x: null, y: null };
  }

  function removePointer() {
    mousePosition = { x: null, y: null };
  }

  function computeSelectedXValue(value: number) {
    return filteredData.filter((d) => xScale(d["time"]) >= value)[0]["time"];
  }

  function formatDate(date: Date) {
    // TODO: scale based on range of dates shown
    // return date.toLocaleDateString("en", {
    //   // year: "numeric",
    //   // month: "2-digit",
    //   // day: "numeric",
    //   // hour: "2-digit",
    //   minute: "numeric"
    // });
    return date.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
  }

  function getDataByMousePosition(mousePositionX: number | null) {
    if (mousePositionX == null) {
      return DEFAULT_DATA;
    }

    const data = filteredData.find(
      (d) => d["time"] === computeSelectedXValue(mousePositionX)
    );

    return data != null ? data : DEFAULT_DATA;
  }
</script>

<svg
  width={chartWidth}
  height={chartHeight}
  id={idContainer}
  on:mousemove={followMouse}
  on:mouseleave={removePointer}
  aria-label="Line Chart"
  role="presentation"
>
  <g>
    {#each filteredData as datum, i}
      {#if i != filteredData.length - 1}
        <line
          x1={xScale(filteredData[i]["time"])}
          x2={xScale(filteredData[i + 1]["time"])}
          y1={yScale(filteredData[i].y)}
          y2={yScale(filteredData[i + 1].y)}
          stroke={getLineColor()}
          stroke-width="2"
        />
      {/if}
    {/each}
  </g>
  <g>
    <line
      x1={paddings.left}
      x2={chartWidth - paddings.right}
      y1={chartHeight - paddings.bottom}
      y2={chartHeight - paddings.bottom}
      stroke="#78716C"
      stroke-width="2"
    />
    <line
      x1={paddings.left}
      x2={paddings.left}
      y1={paddings.top}
      y2={chartHeight - paddings.bottom}
      stroke="#78716C"
      stroke-width="2"
    />
  </g>
  <g>
    {#each yGrid.slice(1) as gridLine}
      <Tick
        x={paddings.left}
        y={yScale(gridLine)}
        value={gridLine}
        direction={"horizontal"}
      />
    {/each}
  </g>
  <g>
    {#each xGrid as gridLine}
      <Tick
        x={xScale(gridLine)}
        y={chartHeight - paddings.bottom}
        value={gridLine}
        direction={"vertical"}
        format={false}
        formatFunction={formatDate}
      />
    {/each}
  </g>
  {#if mousePosition.x !== null}
    <g
      transform="translate({xScale(computeSelectedXValue(mousePosition.x))} 0)"
    >
      <line
        x1="0"
        x2="0"
        y1={paddings.top}
        y2={chartHeight - paddings.bottom - 2}
        stroke="#78716C"
        stroke-width="1"
      />
      <circle
        cx={0}
        cy={getDataByMousePosition(mousePosition.x).y}
        r="3"
        fill={getLineColor()}
      />
    </g>
  {/if}

  {#if mousePosition.x != null && mousePosition.y != null}
    <DateTooltip
      label={yVarTitle}
      data={getDataByMousePosition(mousePosition.x)}
      color={getLineColor()}
      x={mousePosition.x + 180 > chartWidth
        ? mousePosition.x - 195
        : mousePosition.x + 15}
      y={Math.max(0, mousePosition.y - 75)}
      backgroundColor={"black"}
      opacity={0.5}
      textColor={"white"}
      width={180}
      adaptTexts={false}
    />
  {/if}
</svg>
