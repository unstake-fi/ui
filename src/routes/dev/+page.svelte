<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { client, savedNetwork } from "$lib/network/stores";
  import { MAINNET } from "$lib/resources/networks";
  import { derived, get, writable } from "svelte/store";
  import BigNumber from "bignumber.js";
  import { Balance } from "$lib/wallet/coin";
  import NumberInput from "$lib/components/NumberInput.svelte";
  import WalletInfo from "$lib/components/WalletInfo.svelte";
  import type { DeliverTxResponse } from "@cosmjs/stargate";
  import { signer } from "$lib/wallet/stores";
  import { refreshing, statusOf } from "$lib/refreshing";
  import { msg } from "$lib/resources/msg";
  import { TxStep, broadcastTx, simulate } from "$lib/onchain/transaction";
  import { balances } from "$lib/onchain/queries";
  import TxProgress from "$lib/components/TxProgress.svelte";

  const provider =
    "kujira14qqwk3655csqvcg5ft37z25aped46s86vplma4mstp73r0nuy8dqy2xh84";
  const controller = "kujira12nvlxl0zuj30errrd4kpp8tneghe0wcmnwnepamlk0dlduyey7yqehvwwa";

  $: if ($savedNetwork.chainId === MAINNET) {
    if (browser) goto("/");
  }

  const delegateQuery = refreshing(
    async () => {
      const c = await get(client);
      if (!c) return [];
      const res = await c.wasm.queryContractSmart(controller, {
        delegates: {},
      });
      const delegates = res.delegates as [string, string][]; // addr, time
      const filtered = delegates.filter(([addr, time]) => {
        // convert time from nanoseconds, only show expired
        if (new BigNumber(time).isLessThan(new BigNumber(Date.now() * 1e6))) {
          return true;
        }
        return false;
      });
      return filtered;
    },
    { refreshOn: [client] }
  );

  const amountBase = writable("");
  const amountBaseRaw = derived(amountBase, ($amount) => {
    if (!$amount) return new BigNumber(0);
    const asBalance = Balance.fromHuman($amount, `factory/${provider}/unut`);
    return asBalance.amount;
  });

  const amountLst = writable("");
  const amountLstRaw = derived(amountLst, ($amount) => {
    if (!$amount) return new BigNumber(0);
    const asBalance = Balance.fromHuman($amount, `factory/${provider}/unut`);
    return asBalance.amount;
  });

  enum SimulationError {
    WalletDisconnected = "wallet_disconnected",
    ErrorConstructingMsgs = "error_constructing_msgs",
  }
  const status = writable<TxStep>(TxStep.None);

  const msgs = refreshing(
    async () => {
      const s = await get(signer);
      let amtBase = await get(amountBaseRaw);
      let amtLst = await get(amountLstRaw);
      const delegates = await get(delegateQuery);
      if (!s) throw SimulationError.WalletDisconnected;
      if (amtBase.isZero() && amtLst.isZero() && delegates.length === 0)
        throw SimulationError.ErrorConstructingMsgs;
      let jsons = [];
      if (!amtBase.isZero()) {
        jsons.push({
          mint: {
            amount: amtBase.toString(),
            denom: "unut",
          },
        });
      }
      if (!amtLst.isZero()) {
        jsons.push({
          mint: {
            amount: amtLst.toString(),
            denom: "usnut",
          },
        });
      }
      let msgs = jsons.map((json) =>
        msg.wasm.msgExecuteContract({
          sender: s.account().address,
          contract: provider,
          msg: Buffer.from(JSON.stringify(json)),
          funds: [],
        })
      );
      for (const [addr, _] of delegates) {
        msgs.push(
          msg.wasm.msgExecuteContract({
            sender: s.account().address,
            contract: addr,
            msg: Buffer.from(JSON.stringify({ complete: {} })),
            funds: [],
          })
        );
      }
      return msgs;
    },
    { refreshOn: [client, signer, amountBaseRaw, amountLstRaw, delegateQuery] }
  );

  const txSim = refreshing(
    async () => {
      const s = await get(signer);
      const c = await get(client);
      if (!s) throw SimulationError.WalletDisconnected;
      const m = await get(msgs);
      return await simulate(c, s.account(), m, "", status);
    },
    { refreshOn: [signer, client, amountBaseRaw, amountLstRaw], debounce: 300 }
  );
  const txSimStatus = statusOf(txSim);

  let txPromise: Promise<DeliverTxResponse> | undefined = undefined;
  async function executeMint() {
    const s = await get(signer);
    const c = await get(client);
    if (!s) throw new Error("No signer connected");
    const sim = await get(txSim);
    const m = await get(msgs);
    return await broadcastTx(c, s, sim, m!, "", status).then((res) => {
      balances.reload();
      $amountBase = "";
      $amountLst = "";
      return res;
    });
  }
</script>

<TxProgress {status} {txPromise} />

<p>Connect Wallet</p>
<WalletInfo />
<div class="border rounded-md flex flex-col my-2">
  <label for="mintBase" class="text-lg pl-4 pt-2 pb-2">Mint Base Amount</label>
  <NumberInput
    bind:value={$amountBase}
    id="mintBase"
    class="bg-inherit py-2 px-4 text-lg focus:outline-none flex-grow min-w-0"
  />
</div>

<div class="border rounded-md flex flex-col my-2">
  <label for="mintLst" class="text-lg pl-4 pt-2 pb-2">Mint LST Amount</label>
  <NumberInput
    bind:value={$amountLst}
    id="mintLst"
    class="bg-inherit py-2 px-4 text-lg focus:outline-none flex-grow min-w-0"
  />
</div>

<button
  class="w-full button"
  on:click={() => (txPromise = executeMint())}
  disabled={$txSimStatus !== "success"}
>
  Mint
</button>

{#await $delegateQuery then d}
  {#if d.length > 0}
    <div class="flex flex-col gap-2">
      <p class="text-lg">Delegates that are Ready</p>
      {#each d as [addr, _]}
        <span>{addr}</span>
      {/each}
      <button
        class="w-full button"
        on:click={() => (txPromise = executeMint())}
        disabled={$txSimStatus !== "success"}
      >
        Complete Delegate unbonding
      </button>
    </div>
  {/if}
{/await}

<div>
  {$txSimStatus}
  {#if $txSimStatus === "error"}
    <p>Failed to simulate transaction:</p>
    {#await $txSim then sim}
      <p>{sim}</p>
    {:catch e}
      <p>{e}</p>
    {/await}
  {/if}

</div>


<style lang="postcss">
  .button {
    @apply bg-stone-700/50 text-stone-200 py-2 px-4 text-lg rounded-md border hover:bg-stone-600/50 border-stone-600 hover:border-stone-500;
  }
  .button:disabled {
    @apply bg-stone-700/50 text-stone-300 cursor-not-allowed border-stone-600;
  }
</style>
