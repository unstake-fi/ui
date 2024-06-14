<script lang="ts">
  import { onMount } from "svelte";
  import type { DateLineChartData } from "./types";

  export let label;
  export let data: DateLineChartData;
  export let color;
  export let x;
  export let y;
  export let width = 300;
  export let backgroundColor = "white";
  export let opacity = 1;
  export let textColor = "black";
  export let adaptTexts = true;

  const step = 25;
  const paddingLeft = 15;
  const paddingRight = 15;
  const lineLength = 10;
  const spaceBetweenLineText = 3;

  const idContainer = "svg-tooltip-" + Math.random() * 10000;
  const maxTextLength =
    width - paddingLeft - lineLength - spaceBetweenLineText - paddingRight;
  let computedWidth = width;

  onMount(async () => {
    const idContainerElement = document.getElementById(idContainer);

    if (idContainerElement == null) {
      return;
    }

    const texts = idContainerElement.getElementsByClassName("legend-labels");
    const textWidths = [...Array(texts.length).keys()].map((d) => ({
      id: d,
      width: texts[d].getBoundingClientRect().width,
    }));
    const longTexts = textWidths.filter((d) => d.width > maxTextLength);
    if (longTexts.length === 0) return;
    if (adaptTexts) {
      longTexts.map((d) => {
        const textContent = texts[d.id].textContent;
        if (textContent == null) {
          return;
        }

        const numCharsAvailable =
          Math.floor((maxTextLength * textContent.length) / d.width) - 3;
        texts[d.id].textContent =
          textContent.slice(0, numCharsAvailable).trim() + "...";
      });
    } else {
      const maxLength = Math.max(...longTexts.map((d) => d.width));
      computedWidth =
        paddingLeft +
        lineLength +
        spaceBetweenLineText +
        maxLength +
        paddingRight;
    }
  });
</script>

<svg x={x - 10} {y} width={computedWidth + 200} height="250" id={idContainer}>
  <rect
    x="1"
    y="1"
    width={computedWidth}
    height={4 * step}
    stroke="black"
    stroke-width="1"
    fill={backgroundColor}
    {opacity}
  />
  <text
    x={paddingLeft + 3}
    y={step}
    alignment-baseline="middle"
    font-size="14"
    fill={textColor}
    >Date: {data.time.toLocaleString([], { dateStyle: "medium" })}</text
  >
  <text
    x={paddingLeft + 3}
    y={2 * step}
    alignment-baseline="middle"
    font-size="14"
    fill={textColor}
    >Time: {data.time.toLocaleString([], { timeStyle: "medium" })}</text
  >
  <g>
    <line
      x1={paddingLeft}
      x2={paddingLeft + lineLength}
      y1={3 * step - 1}
      y2={3 * step - 1}
      stroke={color}
      stroke-width="3"
    />
    <text
      x={paddingLeft + lineLength + spaceBetweenLineText}
      y={3 * step}
      alignment-baseline="middle"
      font-size="14"
      fill={textColor}
      class="legend-labels"
      >{label}: {data.y.toLocaleString()}</text
    >
    <title>{label}</title>
  </g>
</svg>
