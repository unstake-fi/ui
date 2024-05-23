<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { client, savedNetwork } from "$lib/network/stores";
  import { refreshing } from "$lib/refreshing";
  import { MAINNET, TESTNET } from "$lib/resources/networks";
  import {
    RESERVES,
    icon,
    type ReserveStatusResponse,
  } from "$lib/resources/registry";
  import { Balance } from "$lib/wallet/coin";
  import { get } from "svelte/store";
  import { BigNumber } from "bignumber.js";
  import ReserveWidget from "$lib/components/ReserveWidget.svelte";

  $: testnet = $savedNetwork.chainId === TESTNET;

  if ($savedNetwork.chainId === MAINNET) {
    if (browser) goto("/");
  }

  $: allReserves = Object.values(RESERVES[$savedNetwork.chainId]);

  const reserveStatuses = refreshing(
    async () => {
      let c = await get(client);
      if (!c) return {};
      let statuses = await Promise.all(
        allReserves.map(async (reserve) => {
          let status = await c.wasm.queryContractSmart(reserve.address, {
            status: {},
          });

          status.available = Balance.fromAmountDenom(
            status.available,
            reserve.baseDenom
          );
          status.total = Balance.fromAmountDenom(
            status.total,
            reserve.baseDenom
          );
          status.deployed = Balance.fromAmountDenom(
            status.deployed,
            reserve.baseDenom
          );
          status.reserve_redemption_rate = new BigNumber(
            status.reserve_redemption_rate
          );
          return [reserve.address, status] as [string, ReserveStatusResponse];
        })
      );
      return Object.fromEntries(statuses);
    },
    {
      refreshOn: [client],
    }
  );
</script>

{#if !testnet}
  <div class="flex max-w-prose items-center justify-center mx-auto">
    <div class="text-center">
      <h1 class="text-4xl text-red-500">Only available on Testnet</h1>
    </div>
  </div>
{:else}
  <h1 class="text-4xl text-center mb-4">Protocol Reserves</h1>
  <div class="flex justify-center flex-wrap gap-4 text-stone-200 w-full">
    {#each allReserves as reserve}
      {@const status = $reserveStatuses.then((stats) => stats[reserve.address])}
      <ReserveWidget {status} {reserve} query={reserveStatuses} />
    {/each}
  </div>
{/if}
