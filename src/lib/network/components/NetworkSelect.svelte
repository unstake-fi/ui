<script lang="ts">
  import { NETWORKS } from "$lib/resources/networks";
  import { createPopover, melt } from "@melt-ui/svelte";
  import { ChevronDown } from "lucide-svelte";
  import { writable } from "svelte/store";
  import { fade } from "svelte/transition";
  import { client, savedNetwork } from "../stores";
  import RpcSelect from "./RpcSelect.svelte";

  const open = writable(false);
  const {
    elements: { trigger, content },
  } = createPopover({ open });

  $: networkMeta = $savedNetwork && NETWORKS[$savedNetwork.chainId];
  let networks = Object.values(NETWORKS).sort((a, b) =>
    a === b ? 0 : a.prod ? -1 : 1
  );
</script>

{#if networkMeta}
  <button
    class="p-1.5 button text-xs text-bold space-x-1 overflow-auto w-fit"
    use:melt={$trigger}
    aria-haspopup="true"
    aria-label="Change Network"
  >
    <svelte:component this={networkMeta.icon} class="w-4 h-4" />
    <p
      class="overflow-hidden overflow-ellipsis whitespace-nowrap flex-shrink"
    >
      {networkMeta.name}
      <span class="text-stone-500">({networkMeta.chainId})</span>
    </p>
    <ChevronDown class="w-4 h-4" />
  </button>
{/if}

{#if $open}
  <div use:melt={$content} class="content" transition:fade={{ duration: 100 }}>
    <div class="flex flex-col items-stretch gap-1">
      {#each networks as meta}
        <button
          class="p-1.5 button text-xs text-bold space-x-1 justify-between"
          class:active={$savedNetwork.chainId === meta.chainId}
          aria-label="Change Network"
          on:click={() => {
            $savedNetwork = { chainId: meta.chainId };
          }}
        >
          <div class="flex flex-row space-x-1">
            <svelte:component this={meta.icon} class="w-4 h-4" />
            <p>
              {meta.name}
            </p>
          </div>
          <span class="text-stone-400">({meta.chainId})</span>
        </button>
      {/each}
      <hr class="border-stone-600 mt-2 mb-1" />
      <RpcSelect />
      {#await $client catch e}
        <p class="text-red-400 text-xs">
          {e.message}
        </p>
      {/await}
    </div>
  </div>
{/if}

<style lang="postcss">
  .button {
    @apply rounded-md border border-neutral-600 flex flex-row items-center transition-colors;
    @apply hover:bg-neutral-800;
  }
  .active {
    @apply border-blue-500;
  }
  .content {
    @apply z-20 rounded-md bg-stone-900 p-3 pt-2 shadow-sm border border-neutral-800 w-60;
  }
</style>
