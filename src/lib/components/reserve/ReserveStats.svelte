<script lang="ts">
  import type { ReserveStatusResponse } from "$lib/resources/registry";

  let clazz: string = "";
  export { clazz as class };
  export let status: Promise<ReserveStatusResponse>;

  $: utilization = status.then((s) => {
    if (s.total.amount.isZero()) return 0;
    return s.deployed.amount.div(s.total.amount).times(100).toNumber();
  });

  $: apr = status.then((s) => {
    return s.apr;
  });
</script>

<div class={clazz}>
  <div class="flex items-end justify-between gap-1 w-full text-xs">
    <p class="text-stone-500">APR (30d):</p>
    {#await apr}
      <p>Loading...</p>
    {:then apr}
      {#if apr}
        <p
          class="bg-gradient-to-tr from-red-600 via-red-500 to-amber-500 text-transparent bg-clip-text font-bold xs:text-sm"
        >
          {apr.toFixed(2)}%
        </p>
      {:else}
        <p class="text-stone-500">-</p>
      {/if}
    {:catch}
      <p class="text-stone-500">-</p>
    {/await}
  </div>

  <div class="flex items-end justify-between gap-1 w-full text-xs">
    <p class="text-stone-500">Utilization:</p>
    {#await utilization}
      <p>Loading...</p>
    {:then util}
      <p class="font-medium xs:text-sm">
        {util.toFixed(2)}%
      </p>
    {/await}
  </div>
  <div class="flex items-center justify-between w-full text-xs">
    <p class="text-stone-500">Total:</p>
    {#await status}
      <p>Loading...</p>
    {:then stat}
      <p class="text-sm xs:text-base">
        {stat.total.display()}
      </p>
    {/await}
  </div>
</div>
