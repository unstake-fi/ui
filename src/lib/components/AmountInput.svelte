<script lang="ts" generics="T">
  import { formatBigNumber } from "$lib/wallet/utils";

  import autoAnimate from "@formkit/auto-animate";
  import { Upload } from "lucide-svelte";
  import { BigNumber } from "bignumber.js";

  let clazz: string = "";
  export { clazz as class };
  export let amount: string = "";
  export let max: BigNumber | undefined = undefined;

  let amountInput: HTMLInputElement;

  function handleAmountInput() {
    let value = amountInput.value;

    if (value === "") {
      amount = "";
      return;
    }

    if (!isNaN(value as any) && !isNaN(parseFloat(value))) {
      amount = value;
    } else {
      let i = 0;
      while (amount[i] === value[i]) {
        i++;
      }
      amountInput.value = amount;
      amountInput.selectionStart = amountInput.selectionEnd = i;
    }
  }
</script>

<div class={clazz}>
  <div
    class="flex flex-row w-full h-full border rounded-md border-neutral-600 hover:border-neutral-500 shadow-lg"
  >
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="relative flex flex-row space-x-2 text-left w-full h-full items-stretch px-4 py-2"
      use:autoAnimate={{ duration: 100 }}
    >
      <Upload class="h-6 w-6 text-neutral-500" />
      <input
        bind:this={amountInput}
        value={amount}
        placeholder="0"
        on:input={handleAmountInput}
        on:keydown={(e) => {
          if (e.key === "." && amount.includes(".")) {
            let ss = amountInput.selectionStart || 0;
            let before = amount.slice(0, ss);
            ss -= before.length - before.replace(/\./g, "").length;
            amount = amount.replace(/\./g, "");
            amount = amount.slice(0, ss) + "." + amount.slice(ss);
            amountInput.value = amount;
            amountInput.selectionStart = amountInput.selectionEnd = ss;
          }
        }}
        class="focus:outline-none w-full bg-transparent pr-2"
        on:click={(e) => e.stopPropagation()}
      />
    </div>
    {#if max}
      <button
        class="flex flex-row items-center bg-neutral-700 rounded-r-md border-l border-l-stone-600 px-3 text-grad"
        on:click={() => (amount = max.toFixed())}
      >
        <div
          class="bg-gradient-to-tr from-red-600 to-amber-500 text-transparent bg-clip-text flex flex-row font-bold"
        >
          <p>MAX</p>
          <span class="ml-2">{formatBigNumber(max, 2)}</span>
        </div>
      </button>
    {/if}
  </div>
</div>
