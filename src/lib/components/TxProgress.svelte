<script lang="ts">
  import { savedNetwork } from "$lib/network/stores";
  import { TxStep } from "$lib/onchain/transaction";
  import { NETWORKS } from "$lib/resources/networks";
  import type { DeliverTxResponse } from "@cosmjs/stargate";
  import autoAnimate from "@formkit/auto-animate";
  import { createDialog, melt, type CreateDialogProps } from "@melt-ui/svelte";
  import { Search, X } from "lucide-svelte";
  import { writable, type Readable } from "svelte/store";
  import { scale } from "svelte/transition";
  import TxProgressItem from "./TxProgressItem.svelte";

  export let status: Readable<TxStep>;
  export let txPromise: Promise<DeliverTxResponse> | undefined;

  interface ProgressItem {
    message: string;
    status: "pending" | "success" | "failed";
  }

  let progressItems: ProgressItem[] = [];

  const shouldBeOpen = writable(false);
  $: {
    if (!$shouldBeOpen) {
      shouldBeOpen.set(txPromise !== undefined);
      progressItems = [];
    }
  }
  const handleOpen: CreateDialogProps["onOpenChange"] = ({ curr, next }) => {
    if (!next) {
      txPromise = undefined;
    }
    return next;
  };

  const {
    elements: { portalled, overlay, content, title, close, trigger },
    states: { open },
  } = createDialog({
    open: shouldBeOpen,
    role: "alertdialog",
    escapeBehavior: "ignore",
    closeOnOutsideClick: false,
    onOpenChange: handleOpen,
  });

  const getProgressItems = (step: TxStep): ProgressItem[] => {
    switch (step) {
      case TxStep.AccountQuery:
        return [
          {
            message: "Fetching account information...",
            status: "pending",
          },
        ];
      case TxStep.Simulation:
        const acc = getProgressItems(TxStep.AccountQuery);
        acc[acc.length - 1].status = "success";
        return [
          ...acc,
          {
            message: "Simulating transaction...",
            status: "pending",
          },
        ];
      case TxStep.Simulated:
        const sim = getProgressItems(TxStep.Simulation);
        sim[sim.length - 1].status = "success";
        return sim;
      case TxStep.Signing:
        const simulated = getProgressItems(TxStep.Simulated);
        simulated[simulated.length - 1].status = "success";
        return [
          ...simulated,
          {
            message: "Waiting for user signature...",
            status: "pending",
          },
        ];
      case TxStep.Broadcast:
        const signed = getProgressItems(TxStep.Signing);
        signed[signed.length - 1].status = "success";
        return [
          ...signed,
          {
            message: "Broadcasting transaction...",
            status: "pending",
          },
        ];
      case TxStep.Inclusion:
        const broadcasted = getProgressItems(TxStep.Broadcast);
        broadcasted[broadcasted.length - 1].status = "success";
        return [
          ...broadcasted,
          {
            message: "Waiting for transaction to be included in blockchain...",
            status: "pending",
          },
        ];
      case TxStep.Committed:
        const included = getProgressItems(TxStep.Inclusion);
        included[included.length - 1].status = "success";
        return included;
      default:
        return [];
    }
  };

  $: {
    if ($status === TxStep.Error) {
      if (progressItems.length !== 0) {
        progressItems[progressItems.length - 1].status = "failed";
      }
    } else if ($status === TxStep.None) {
    } else {
      progressItems = getProgressItems($status);
    }
  }
</script>

<button use:melt={$trigger} class="hidden absolute" />
<div use:melt={$portalled}>
  {#if $open}
    <div use:melt={$overlay} class="overlay" />
    <div
      class="content"
      transition:scale={{
        duration: 150,
      }}
      use:melt={$content}
    >
      <h2 use:melt={$title} class="m-0 mb-2 text-lg">
        Executing Transaction...
      </h2>
      <div class="flex flex-col space-y-2" use:autoAnimate>
        {#each progressItems as item}
          <TxProgressItem message={item.message} status={item.status} />
        {/each}
        <div use:autoAnimate class="flex flex-col w-full gap-2">
          {#if $status === TxStep.Error}
            {#await txPromise catch res}
              {#if res !== undefined}
                <div
                  class="border border-red-500 rounded-md p-2 bg-red-500/20 w-full"
                >
                  <p class="text-stone-200 text-xs break-words">
                    {res.message ? res.message : res}
                  </p>
                </div>
              {/if}
            {/await}
          {/if}
          {#if $status === TxStep.Committed || $status === TxStep.Error}
            {#await txPromise then tx}
              {#if tx !== undefined}
                <a
                  class="text-sm text-lime-600 flex items-center space-x-1"
                  href="{NETWORKS[$savedNetwork.chainId]
                    .explorer}/tx/{tx.transactionHash}"
                  target="_blank"
                >
                  <Search class="w-4 h-4" />
                  <span>View transaction in Finder</span>
                </a>
              {/if}
            {:catch err}
              {#if err.transactionHash}<a
                  class="text-sm text-red-500 flex items-center space-x-1"
                  href="{NETWORKS[$savedNetwork.chainId]
                    .explorer}/tx/{err.transactionHash}"
                  target="_blank"
                >
                  <Search class="w-4 h-4" />
                  <span>View transaction in Finder</span>
                </a>
              {/if}
            {/await}
          {/if}
          {#if $status === TxStep.Committed}
            <button
              use:melt={$close}
              class="w-full button px-2 py-1 bg-stone-800 mt-2"
            >
              Done
            </button>
          {:else if $status === TxStep.Error}
            <button
              use:melt={$close}
              class="w-full button px-2 py-1 bg-stone-800 mt-2"
            >
              Ok
            </button>
          {/if}
        </div>
      </div>
      {#if $status === TxStep.Committed || $status === TxStep.Error}
        <button
          use:melt={$close}
          aria-label="close"
          class="absolute right-4 top-5 inline-flex appearance-none
                    items-center justify-center rounded-full"
        >
          <X class="w-6 h-6" />
        </button>
      {/if}
    </div>
  {/if}
</div>

<style lang="postcss">
  .content {
    @apply m-0 p-0 fixed z-50;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%);
    @apply max-h-[85vh] w-[90vw] max-w-[450px];
    @apply rounded-lg p-6 pt-4 bg-stone-900 text-inherit overflow-visible;
  }
  .overlay {
    @apply fixed inset-0 z-50 bg-black/50 backdrop-blur-sm;
  }

  .button {
    @apply rounded-md border border-neutral-600 flex flex-col items-center transition-colors;
    @apply hover:border-neutral-500 hover:bg-stone-700;
  }
</style>
