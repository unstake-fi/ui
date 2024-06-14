<script lang="ts">
  export let x;
  export let y;
  export let value;
  export let direction;
  export let format = true;
  export let formatFunction: ((data: any) => string) | undefined = undefined;

  const xTranslation = direction === "horizontal" ? x - 10 : x;

  const valueLabel =
    formatFunction !== undefined
      ? formatFunction(value)
      : value;
</script>

<g transform={"translate(" + xTranslation + ", " + y + ")"}>
  <text
    y={direction === "horizontal" ? 0 : 20}
    font-size="13px"
    text-anchor={direction === "horizontal" ? "end" : "middle"}
    alignment-baseline="middle"
    stroke="white">{valueLabel}</text
  >
  {#if direction === "horizontal"}
    <line x1={2} x2={8} y1={0} y2={0} stroke="#78716C" stroke-width="1" />
  {:else}
    <line x1={0} x2={0} y1={2} y2={8} stroke="#78716C" stroke-width="1" />
  {/if}
</g>
