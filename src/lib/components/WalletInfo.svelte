<script lang="ts">
  import NetworkSelect from "$lib/network/components/NetworkSelect.svelte";
  import { savedNetwork } from "$lib/network/stores";
  import { MAINNET, NETWORKS } from "$lib/resources/networks";
  import { WalletAdapter } from "$lib/wallet/adapters/types";
  import { savedAdapter, signerResolved } from "$lib/wallet/stores";
  import { createPopover, createSync, melt } from "@melt-ui/svelte";
  import { Search } from "lucide-svelte";
  import { fade } from "svelte/transition";
  import WalletDialog from "./WalletDialog.svelte";
  import { writable } from "svelte/store";

  export let open = false;

  const {
    elements: { trigger, content, arrow, close },
    states,
  } = createPopover({
    forceVisible: true,
  });

  const sync = createSync(states);
  $: sync.open(open, (v) => (open = v));

  function displayAddr(addr: string | undefined, len: number): string {
    if (!addr) return "";
    return addr.slice(0, len) + "..." + addr.slice(-len);
  }

  const openWalletDialog = writable(false);

  $: isConnected =
    $signerResolved?.getMetadata().adapter ??
    WalletAdapter.Disconnected !== WalletAdapter.Disconnected;
</script>

{#if isConnected}
  <button
    class="button flex items-center xs:gap-1 bg-neutral-800 rounded-md px-4 py-2"
    use:melt={$trigger}
  >
    <svelte:component
      this={$signerResolved?.getMetadata().logo}
      class="w-6 h-6"
    />
    <p class="text-xs text-left text-neutral-200 hidden xs:inline">
      {displayAddr($signerResolved?.account().address, 10)}
    </p>
  </button>
{:else}
  <button
    class="border border-amber-600 bg-gradient-to-tr from-red-900/40 to-amber-700/40 px-4 py-2 rounded-md my-2"
    id="connect"
    on:click={() => openWalletDialog.set(true)}
  >
    <label
      for="connect"
      class="flex items-center justify-center text-amber-300/80 cursor-pointer"
    >
      <p class="text-sm xs:text-base">Connect Wallet</p>
    </label>
  </button>
{/if}

{#if open}
  <div
    use:melt={$content}
    transition:fade={{ duration: 100 }}
    class="bg-stone-900 rounded-md p-2"
  >
    <div use:melt={$arrow} />
    <div class="flex flex-col items-center gap-2.5 mt-1">
      <a
        class="p-1.5 button flex items-center gap-1"
        href="{NETWORKS[$savedNetwork.chainId ?? MAINNET]
          .explorer}/address/{$signerResolved?.account().address}"
        target="_blank"
      >
        <p class="text-xs text-left text-stone-400">
          {displayAddr($signerResolved?.account().address, 16)}
        </p>
        <Search class="w-4 h-4" />
      </a>
      <NetworkSelect />
      <button
        class="button px-2 py-1 bg-stone-800 text-xs text-stone-200 uppercase"
        on:click={(_) => savedAdapter.set(WalletAdapter.Disconnected)}
      >
        Disconnect
      </button>
    </div>
  </div>
{/if}

<WalletDialog open={openWalletDialog} />

<style>
  .button {
    @apply rounded-md border border-neutral-600 flex flex-row items-center transition-colors;
    @apply hover:bg-neutral-700;
  }
</style>
