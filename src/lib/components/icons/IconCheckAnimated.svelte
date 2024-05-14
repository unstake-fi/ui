<script lang="ts">
  let clazz: string = "";
  export { clazz as class };
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={clazz}
>
  <path
    d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
    class="stroke-current fill-none animate-[stroke_0.7s_ease-in-out_forwards]"
    stroke-dasharray="166"
    stroke-dashoffset="166"
    stroke-miterlimit="10"
   />
  <polyline
    points="22 4 12 14.01 9 11.01"
    class="stroke-current fill-none animate-[stroke_0.5s_ease-in-out_0.0s_forwards]"
    stroke-dasharray="48"
    stroke-dashoffset="-48"
    stroke-miterlimit="10"
  />
</svg>

<style lang="postcss">
  @keyframes -global-stroke {
    100% {
      stroke-dashoffset: 0;
    }
  }
</style>
