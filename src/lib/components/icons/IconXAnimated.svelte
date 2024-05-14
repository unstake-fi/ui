<script lang="ts">
    let clazz: string = "";
    export { clazz as class };
  </script>
  
  <svg
    class={clazz}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 52 52"
    width="100%"
    height="100%"
  >
    <circle
      class="stroke-current fill-none animate-[stroke_0.7s_ease-in-out_forwards]"
      cx="26"
      cy="26"
      r="25"
      stroke-width="2.5"
      stroke-dasharray="157"
      stroke-dashoffset="157"
      stroke-miterlimit="10"
    />
    <path
      class="origin-center stroke-current fill-none animate-[stroke_0.3s_ease-in-out_0.4s_forwards]"
      d="M16 36 L36 16 M16 16 L36 36"
      stroke-width="2.5"
      stroke-dasharray="57.76,57.76"
      stroke-dashoffset="57.76"
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
  