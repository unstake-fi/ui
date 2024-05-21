<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { savedNetwork } from "$lib/network/stores";
  import { MAINNET, TESTNET } from "$lib/resources/networks";

  $: testnet = $savedNetwork.chainId === TESTNET;

  if ($savedNetwork.chainId === MAINNET) {
    if (browser) goto("/");
  }
</script>

<div class="flex max-w-prose items-center justify-center mx-auto">
  <div class="text-center">
    {#if testnet}
      <h1 class="text-4xl text-red-500">Coming Soon to Testnet</h1>
    {:else}
      <h1 class="text-4xl text-red-500">Only available on Testnet</h1>
    {/if}
  </div>
</div>
