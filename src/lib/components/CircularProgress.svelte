<script lang="ts">
  import { quadOut } from "svelte/easing";
  import { tweened } from "svelte/motion";

  let clazz: string = "";
  export { clazz as class };
  export let percent: number | Promise<number> = 0;

  let currentPercent = tweened(0, {
    duration: 1000,
    delay: 0,
    easing: quadOut,
  });
  $: {
    if (typeof percent === "number") {
      $currentPercent = percent;
    } else {
      $currentPercent = 0;
      percent.then((p) => {
        $currentPercent = p;
      });
    }
  }
</script>

<div class="relative aspect-square max-w-full max-h-full">
  <svg
    viewBox="-10 -10 200 200"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    transform="rotate(-90)"
    class="absolute max-w-full max-h-full"
  >
    <defs>
      <clipPath id="cut-off">
        <rect x="0" y="50" width="100" height="100" />
      </clipPath>
      <linearGradient id="circularGradient">
        <stop offset="0" stop-color="#f59e0b"></stop>
        <stop offset="75%" stop-color="#ef4444"></stop>
        <stop offset="100%" stop-color="#dc2626"></stop>
      </linearGradient>
    </defs>
    <circle
      class="circle stroke-stone-600"
      r="90"
      cx="90"
      cy="90"
      fill="transparent"
      stroke-width="16px"
      stroke-dashoffset="0"
    ></circle>
    <circle
      class="circle circle-offset"
      style="--percent: {$currentPercent}"
      r="90"
      cx="90"
      cy="90"
      stroke="url(#circularGradient)"
      stroke-width="16px"
      stroke-linecap="round"
      fill="transparent"
    ></circle>
  </svg>
  <div class={clazz}>
    <slot />
  </div>
</div>

<style lang="postcss">
  .circle {
    --diameter: 90px;
    --circumference: calc(2 * pi * var(--diameter));
    stroke-dasharray: var(--circumference);
  }

  .circle-offset {
    stroke-dashoffset: calc(
      var(--circumference) - (var(--percent) / 100) * var(--circumference)
    );
  }
</style>
