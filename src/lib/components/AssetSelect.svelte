<script lang="ts" generics="T">
  import autoAnimate from "@formkit/auto-animate";

  import { onMount } from "svelte";

  let clazz: string = "";
  export { clazz as class };
  export let items: T[];
  export let amount: string = "";
  export let meta: {
    icon: (item: T) => any | undefined;
    label: (item: T) => string | undefined;
    filter: (item: T, search: string) => boolean | undefined;
    balance?: (item: T) => string | undefined;
  };
  export let active: T | undefined;

  let open = false;
  let search = "";
  let node: HTMLDivElement;
  let assetInput: HTMLInputElement | undefined;

  $: filteredOptions = items.filter(
    (item) => meta.filter(item, search) ?? true
  );

  let amountInput: HTMLInputElement;

  function handleClickOutside(event: MouseEvent) {
    if (!node.contains(event.target as Node)) {
      open = false;
    }
  }

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

  onMount(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });

  $: open && assetInput && assetInput.focus();
  $: !open && (search = "");
</script>

<div class={clazz}>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    bind:this={node}
    class="relative inline-block text-left w-full"
    use:autoAnimate={{ duration: 100 }}
  >
    <div class="flex">
      <button
        id="asset"
        type="button"
        class="border border-r-0 rounded-tl-md basis-1/2"
        class:rounded-bl-md={!open}
        aria-haspopup="true"
        aria-expanded="true"
        on:click={() => {
          open = true;
        }}
      >
        {#if open}
          <input
            bind:this={assetInput}
            bind:value={search}
            class="focus:outline-none w-full bg-transparent mx-4 my-2 h-8"
          />
        {:else}
          <div class="w-full mx-4 my-2 flex flex-row items-center h-8">
            {#if active && meta.icon(active)}
              <div class="mr-2">
                <div class="h-8 w-8">
                  <svelte:component this={meta.icon(active)} />
                </div>
              </div>
            {/if}
            {active ? meta.label(active) ?? "" : ""}
          </div>
        {/if}
      </button>
      <div class="border-r border-slate-600" />
      <button
        id="amount"
        class="border border-l-0 rounded-tr-md basis-1/2"
        class:rounded-br-md={!open}
      >
        <input
          bind:this={amountInput}
          value={amount}
          placeholder="0"
          on:focus={() => {
            open = false;
          }}
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
          class="focus:outline-none w-full bg-transparent pr-2 text-right h-full"
          on:click={(e) => e.stopPropagation()}
        />
      </button>
    </div>

    {#if open}
      <div
        class="origin-top-right absolute left-0 w-full rounded-b-md shadow-lg border border-t-0 border-slate-600 z-10"
      >
        <div
          class="bg-background text-sm rounded-b-md"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="asset"
        >
          {#each filteredOptions as m}
            <div
              class="menu-item"
              on:click={(e) => {
                active = m;
                open = false;
                e.stopPropagation();
              }}
            >
              <div class="flex items-center">
                {#if meta.icon(m)}
                  <div class="mr-2">
                    <div class="h-6 w-6">
                      <svelte:component this={meta.icon(m)} />
                    </div>
                  </div>
                {/if}
                {meta.label(m)}
              </div>
              {#if meta.balance && meta.balance(m)}
                <div class="text-gray-400 text-xs text-right">
                  {meta.balance(m)}
                </div>
              {/if}
            </div>
          {:else}
            <div class="menu-item">No items found</div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  #asset,
  #amount {
    @apply flex justify-center shadow-lg;
    @apply text-base font-medium tracking-wide;
    /* @apply transition-all duration-100; */
    @apply border-slate-600 hover:border-slate-500;
    @apply bg-transparent;
  }
  .menu-item {
    @apply flex justify-between cursor-pointer items-center px-4 py-2 h-8;
    @apply hover:bg-slate-700 text-gray-400 hover:text-white;
    /* @apply transition-all duration-100; */
  }
</style>
