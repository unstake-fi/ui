<script lang="ts">
  import { scaleLinear, scaleUtc } from "d3-scale";
  import Tick from "./Tick.svelte";
  import DateTooltip from "./DateTooltip.svelte";
  import { extent } from "d3";
  import type { DateLineChartData, TimeRange } from "./types";

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

  function getClosestDate(date: Date, range: Range) {
    const newDate = new Date(date.getTime());
    switch (range) {
      case "1D":
      case "5D":
        // Per day
        newDate.setHours(0);
        newDate.setMinutes(0);
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
        return newDate;
      case "6M":
      case "1Y":
      case "MAX":
        // Per month
        newDate.setHours(0);
        newDate.setMinutes(0);
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
        newDate.setDate(0);
        return newDate;
    }
  }

  function getNextDate(date: Date, range: Range) {
    switch (range) {
      case "1D":
      case "5D":
        const tomorrowDate = new Date(date.getTime());
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        return tomorrowDate;
      case "6M":
      case "1Y":
      case "MAX":
        if (date.getMonth() == 11) {
          return new Date(date.getFullYear() + 1, 0, 1);
        } else {
          return new Date(date.getFullYear(), date.getMonth() + 1, 1);
        }
    }
  }

  function filterData(
    dateLineChartData: DateLineChartData[]
  ): DateLineChartData[] {
    const range = "6M";

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

    const initialDates: { [key: string]: DateLineChartData } = {};
    let currentDate = new Date(Date.now() - msInRange(range));

    while (currentDate.getTime() < Date.now()) {
      const timeKey = getClosestDate(currentDate, range).toISOString();
      initialDates[timeKey] = {
        y: 0,
        time: getClosestDate(currentDate, range),
      };
      currentDate = getNextDate(currentDate, range);
      console.log(currentDate);
    }

    console.log("initial");
    console.log(initialDates);
    console.log("rounded");

    console.log(roundedDates);

    const aggregatedDates = Object.values(
      roundedDates.reduce(
        (acc: { [key: string]: DateLineChartData }, current) => {
          const timeKey = current.time.toISOString();
          acc[timeKey].y += current.y;
          return acc;
        },
        initialDates
      )
    ).sort((a, b) => a.time.getTime() - b.time.getTime());

    console.log("aggreged");
    console.log(aggregatedDates);

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
