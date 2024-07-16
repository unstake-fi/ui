<script lang="ts">
  import { client, savedNetwork } from "$lib/network/stores";
  import { balances } from "$lib/onchain/queries";
  import { broadcastTx, simulate, TxStep } from "$lib/onchain/transaction";
  import { refreshing } from "$lib/refreshing";
  import { denom } from "$lib/resources/denoms";
  import { msg } from "$lib/resources/msg";
  import { MAINNET } from "$lib/resources/networks";
  import { icon, MEMO, REWARDS_CONTRACT } from "$lib/resources/registry";
  import { Balance } from "$lib/wallet/coin";
  import { signer } from "$lib/wallet/stores";
  import { calculateFee } from "$lib/wallet/utils";
  import { GasPrice, type DeliverTxResponse } from "@cosmjs/stargate";
  import type { Coin } from "cosmjs-types/cosmos/base/v1beta1/coin";
  import { get, writable } from "svelte/store";
  import TxProgress from "./TxProgress.svelte";
  import { Fuel } from "lucide-svelte";
  import autoAnimate from "@formkit/auto-animate";

  const stakingRewards = refreshing(
    async () => {
      const c = await get(client);
      const s = await get(signer);
      if (!c || !s) return [];

      if ($savedNetwork.chainId !== MAINNET) {
        return [];
      }

      let rewards: { rewards: Coin[] } = await c.wasm.queryContractSmart(
        REWARDS_CONTRACT[$savedNetwork.chainId],
        { pending_rewards: { staker: s.account().address } }
      );

      return rewards.rewards;
    },
    {
      refreshOn: [client, signer],
    }
  );

  enum SimulationError {
    WalletDisconnected = "wallet_disconnected",
    ErrorConstructingMsgs = "error_constructing_msgs",
  }
  const txStatus = writable<TxStep>(TxStep.None);
  const msgs = refreshing(
    async () => {
      const s = await get(signer);
      const rewards = await get(stakingRewards);
      if (!s) throw SimulationError.WalletDisconnected;
      if (!rewards) throw SimulationError.ErrorConstructingMsgs;
      if (rewards.length === 0) return [];
      const msgs = [
        msg.wasm.msgExecuteContract({
          sender: s.account().address,
          contract: REWARDS_CONTRACT[$savedNetwork.chainId],
          msg: Buffer.from(JSON.stringify({ claim_rewards: {} })),
          funds: [],
        }),
      ];
      return msgs;
    },
    { refreshOn: [client, signer, stakingRewards] }
  );

  let msgsResolved = msgs.resolved;
  $: console.log(msgsResolved);

  const txSim = refreshing(
    async () => {
      const s = await get(signer);
      const c = await get(client);
      if (!s) throw SimulationError.WalletDisconnected;
      const m = await get(msgs);
      if (m.length === 0) throw SimulationError.ErrorConstructingMsgs;
      return await simulate(c, s.account(), m, MEMO, txStatus);
    },
    { refreshOn: [signer, client, msgs], debounce: 300 }
  );

  const estimatedFee = refreshing(
    async () => {
      const s = await get(txSim);
      const fee = calculateFee(
        s.gasInfo!,
        GasPrice.fromString("0.0034ukuji"),
        1.7
      );
      return Balance.from(fee.amount[0]);
    },
    { refreshOn: [txSim] }
  );

  let txPromise: Promise<DeliverTxResponse> | undefined = undefined;
  async function executeClaimRewards() {
    const s = await get(signer);
    const c = await get(client);
    if (!s) throw new Error("No signer connected");
    const sim = await get(txSim);
    const m = await get(msgs);
    return await broadcastTx(c, s, sim, m!, MEMO, txStatus).then((res) => {
      balances.reload();
      stakingRewards.reload();
      return res;
    });
  }
</script>

<div class="bg-stone-800 rounded-lg py-2 px-2.5" use:autoAnimate>
  <TxProgress status={txStatus} {txPromise} />

  {#await $stakingRewards}
    <p>Loading Staking Rewards...</p>
  {:then rewards}
    <div class="flex flex-col w-full">
      <h2 class="text-lg xs:text-xl md:text-2xl m-0">Staking Rewards</h2>
      {#each rewards as r}
        {@const balance = Balance.fromAmountDenom(r.amount, r.denom)}
        <div class="flex items-center gap-2">
          <svelte:component this={icon(r.denom)} class="w-6 h-6" />
          <p class="text-sm xs:text-base">
            {balance.humanAmount(3)}
            <span class="text-stone-500">{balance.name}</span>
          </p>
        </div>
      {:else}
        <p class="text-stone-500">No staking rewards available</p>
      {/each}

      {#await $estimatedFee then fee}
        <div class="flex items-center gap-1 text-stone-500 mt-1">
          <Fuel class="w-4 h-4 inline-block" />
          <p class="text-xs">
            {fee.display(4)} estimated fee
          </p>
        </div>
      {/await}
      {#if rewards.length > 0}
        <button
          class="button flex-1 button-padding my-2"
          on:click={() => {
            txPromise = executeClaimRewards();
          }}
        >
          Claim Rewards
        </button>
      {/if}
    </div>
  {/await}
</div>

<style lang="postcss">
  .button {
    @apply bg-stone-800 border border-stone-600 rounded-md transition-colors;
    @apply hover:bg-stone-700 hover:border-stone-500;
  }

  .button-padding {
    @apply xs:px-4 xs:py-2 px-2 py-1;
  }
</style>
