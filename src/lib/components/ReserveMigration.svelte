<script lang="ts">
  import { client, savedNetwork } from "$lib/network/stores";
  import { balances } from "$lib/onchain/queries";
  import { DENOMS } from "$lib/resources/denoms";
  import { CONTROLLERS, RESERVES } from "$lib/resources/registry";
  import { signer } from "$lib/wallet/stores";
  import { formatBigNumber } from "$lib/wallet/utils";
  import { derived, get, writable } from "svelte/store";
  import BigNumber from "bignumber.js";
  import autoAnimate from "@formkit/auto-animate";
  import { refreshing, statusOf } from "$lib/refreshing";
  import { msg } from "$lib/resources/msg";
  import { TxStep, broadcastTx, simulate } from "$lib/onchain/transaction";
  import type { DeliverTxResponse } from "@cosmjs/stargate";
  import TxProgress from "./TxProgress.svelte";

  const toMigrate = derived(
    [signer.resolved, balances.resolved],
    ([$signer, $balances]) => {
      if (!$signer || !$balances) return [];
      let denoms = [];
      for (const controller of Object.values(
        CONTROLLERS[$savedNetwork.chainId]
      )) {
        const denom = `factory/${controller.address}/ursv`;
        const reserve = $balances.get(denom);
        if (reserve) {
          denoms.push({ reserve, controller, denom });
        }
      }

      return denoms;
    }
  );

  enum SimulationError {
    WalletDisconnected = "wallet_disconnected",
    ErrorConstructingMsgs = "error_constructing_msgs",
  }
  const status = writable<TxStep>(TxStep.None);
  const msgs = refreshing(
    async () => {
      const s = await get(signer);
      if (!s) throw SimulationError.WalletDisconnected;
      if ($toMigrate.length === 0) throw SimulationError.ErrorConstructingMsgs;
      let msgs = [];
      for (const { controller, reserve } of $toMigrate) {
        let reserveConfig = Object.values(RESERVES[$savedNetwork.chainId]).find(
          (r) => r.baseDenom === controller.offerDenom
        );
        if (!reserveConfig)
          throw new Error(
            "No reserve config found for " + controller.offerDenom
          );
        msgs.push(
          msg.wasm.msgExecuteContract({
            sender: s.account().address,
            contract: reserveConfig?.address,
            msg: Buffer.from(
              JSON.stringify({
                exchange_legacy_reserve: {},
              })
            ),
            funds: reserve.toCoins(),
          })
        );
      }
      return msgs;
    },
    { refreshOn: [client, signer, toMigrate] }
  );

  const txSim = refreshing(
    async () => {
      const s = await get(signer);
      const c = await get(client);
      if (!s) throw SimulationError.WalletDisconnected;
      const m = await get(msgs);
      return await simulate(c, s.account(), m, "", status);
    },
    { refreshOn: [signer, client, toMigrate], debounce: 300 }
  );
  const txSimStatus = statusOf(txSim);

  let txPromise: Promise<DeliverTxResponse> | undefined = undefined;
  async function executeMigrate() {
    const s = await get(signer);
    const c = await get(client);
    if (!s) throw new Error("No signer connected");
    const sim = await get(txSim);
    const m = await get(msgs);
    return await broadcastTx(c, s, sim, m!, "", status).then((res) => {
      balances.reload();
      return res;
    });
  }
</script>

<div use:autoAnimate>
  <TxProgress {status} {txPromise} />
  {#if $toMigrate.length}
    <div
      class="flex items-stretch flex-col gap-1 bg-red-500/20 border border-red-500 rounded-md p-2 text-red-500 text-xs"
    >
      <h2 class="text-base uppercase font-bold">Migrate Your Reserves</h2>
      <p>
        You have <b>{$toMigrate.length}</b>
        types of legacy Unstake reserves to migrate. This is a one-time operation
        to facilitate reserve unification, as introduced in Unstake v1.0
      </p>
      <h3 class="text-sm uppercase font-bold">Unmigrated Reserves:</h3>
      <ul>
        {#each $toMigrate as { controller, reserve }}
          <li>
            <b>
              {formatBigNumber(reserve.amount.div(new BigNumber(10).pow(6)), 2)}
              {DENOMS[controller.askDenom].name}
            </b>
            Reserve &rarr; {DENOMS[controller.offerDenom].name} Unified Reserve
          </li>
        {/each}
      </ul>
      <button
        class="w-full button"
        on:click={() => (txPromise = executeMigrate())}
        disabled={$txSimStatus !== "success"}
      >
        Migrate Reserves
      </button>
    </div>
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
