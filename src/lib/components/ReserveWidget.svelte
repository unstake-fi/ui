<script lang="ts">
  import { denom } from "$lib/resources/denoms";
  import {
    MEMO,
    icon,
    type ReserveConfig,
    type ReserveStatusResponse,
  } from "$lib/resources/registry";
  import CircularProgress from "./CircularProgress.svelte";
  import NumberInput from "./NumberInput.svelte";
  import { derived, get, writable, type Writable } from "svelte/store";
  import { signer } from "$lib/wallet/stores";
  import { balances } from "$lib/onchain/queries";
  import { calculateFee, formatBigNumber } from "$lib/wallet/utils";
  import { Balance } from "$lib/wallet/coin";
  import { TxStep, broadcastTx, simulate } from "$lib/onchain/transaction";
  import { refreshing, statusOf, type Refreshing } from "$lib/refreshing";
  import { client } from "$lib/network/stores";
  import { msg } from "$lib/resources/msg";
  import { GasPrice, type DeliverTxResponse } from "@cosmjs/stargate";
  import TxProgress from "./TxProgress.svelte";
  import autoAnimate from "@formkit/auto-animate";
  import { BigNumber } from "bignumber.js";
  import { Fuel, OctagonX } from "lucide-svelte";

  export let status: Promise<ReserveStatusResponse>;
  export let query: Refreshing<any>;
  export let reserve: ReserveConfig;

  $: utilization = status.then((s) => {
    if (s.total.amount.isZero()) return 67.5; //TODO: set to 0
    return s.deployed.amount.div(s.total.amount).times(100).toNumber();
  });

  const selected: Writable<string | null> = writable(null);
  const maxSelectedDenom = derived(
    [signer.resolved, balances.resolved, selected],
    ([$signer, $balances, $selected]) => {
      if (!$balances || !$signer) return undefined;
      const denom =
        $selected === "provide" ? reserve.baseDenom : reserve.rsvDenom;
      return $balances.get(denom)?.normalized() ?? BigNumber(0);
    }
  );

  const amount = writable("");
  const amountRaw = derived([amount, selected], ([$amount, $selected]) => {
    const denom =
      $selected === "provide" ? reserve.baseDenom : reserve.rsvDenom;
    if (!$amount) return Balance.fromHuman("0", denom);
    return Balance.fromHuman($amount, denom);
  });

  enum SimulationError {
    WalletDisconnected = "wallet_disconnected",
    ErrorConstructingMsgs = "error_constructing_msgs",
  }
  const txStatus = writable<TxStep>(TxStep.None);
  const msgs = refreshing(
    async () => {
      const s = await get(signer);
      const c = await get(client);
      const amount = await get(amountRaw);
      const sel = $selected;
      if (!s) throw SimulationError.WalletDisconnected;
      if (amount.amount.isZero() || !sel)
        throw SimulationError.ErrorConstructingMsgs;
      let json;
      if ($selected === "provide") {
        json = {
          fund: {},
        };
      } else {
        json = {
          withdraw: {},
        };
      }
      const msgs = [
        msg.wasm.msgExecuteContract({
          sender: s.account().address,
          contract: reserve.address,
          msg: Buffer.from(JSON.stringify(json)),
          funds: amount.toCoins(),
        }),
      ];
      return msgs;
    },
    { refreshOn: [client, signer, amountRaw, selected] }
  );

  const txSim = refreshing(
    async () => {
      const s = await get(signer);
      const c = await get(client);
      if (!s) throw SimulationError.WalletDisconnected;
      const m = await get(msgs);
      return await simulate(c, s.account(), m, MEMO, txStatus);
    },
    { refreshOn: [signer, client, amountRaw, selected], debounce: 300 }
  );
  const txSimStatus = statusOf(txSim);

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
  async function executeReserveAction() {
    const s = await get(signer);
    const c = await get(client);
    if (!s) throw new Error("No signer connected");
    const sim = await get(txSim);
    const m = await get(msgs);
    return await broadcastTx(c, s, sim, m!, MEMO, txStatus).then((res) => {
      balances.reload();
      query.reload();
      $selected = null;
      return res;
    });
  }
</script>

<TxProgress status={txStatus} {txPromise} />

<div
  class="flex flex-col bg-stone-800 rounded-lg p-4 max-w-72 items-center flex-1"
>
  <CircularProgress class="p-10" percent={utilization}>
    <div class="flex flex-col items-center gap-0.5">
      <svelte:component this={icon(reserve.baseDenom)} class="h-16 w-16 mt-2" />
      <p class="text-sm text-center">
        {denom(reserve.baseDenom)?.name}
      </p>
    </div>
  </CircularProgress>
  <div class="flex gap-4 mt-2 w-full">
    <button
      class={`button ${$selected !== "provide" ? "px-4 py-2" : ""} flex-1 flex flex-col items-start`}
      on:click={() => {
        $selected = "provide";
      }}
      class:hidden={$selected === "withdraw"}
      class:active={$selected === "provide"}
    >
      {#if $selected === "provide"}
        <NumberInput
          class="bg-inherit focus:outline-none w-full pl-2.5 pr-4 pt-1 rounded-md"
          autofocus={true}
          bind:value={$amount}
        />
        <button
          class="flex text-xs px-1.5 ml-1 py-0.5 -mt-0.5 mb-1 rounded-md border border-transparent hover:border-stone-600 hover:bg-stone-700/50 hover:text-amber-300 z-10 text-stone-300"
          on:click={(_) => ($amount = $maxSelectedDenom?.toFixed() ?? "0")}
        >
          <p class="text-stone-500 mr-1">Available:</p>
          {#if $maxSelectedDenom !== undefined}
            <p class="text-inherit">
              {Balance.fromHuman(
                $maxSelectedDenom.toFixed(),
                reserve.baseDenom
              ).display(2)}
            </p>
          {:else}
            <p class="text-red-500">0.00</p>
          {/if}
        </button>
        {#await status then stats}
          <div
            class="flex flex-col ml-0.5 px-2 text-xs w-full items-start mb-1"
          >
            <hr class="w-full border-stone-600 mb-1" />
            <p class="text-stone-500 mr-1">Receive:</p>
            <p class="text-inherit text-base">
              {Balance.fromAmountDenom(
                $amountRaw.amount
                  .dividedBy(stats.reserve_redemption_rate)
                  .toString(),
                reserve.rsvDenom
              ).display(6)}
            </p>
          </div>
        {/await}
      {:else}
        <p class="text-center w-full">Provide</p>
      {/if}
    </button>
    <button
      class={`button ${$selected !== "withdraw" ? "px-4 py-2" : ""} flex-1 flex flex-col items-start`}
      on:click={() => {
        $selected = "withdraw";
      }}
      class:hidden={$selected === "provide"}
      class:active={$selected === "withdraw"}
    >
      {#if $selected === "withdraw"}
        <NumberInput
          class="bg-inherit focus:outline-none w-full pl-2.5 pr-4 pt-1 rounded-md"
          autofocus={true}
          bind:value={$amount}
        />
        <button
          class="flex text-xs px-1.5 ml-1 py-0.5 -mt-0.5 mb-0.5 rounded-md border border-transparent hover:border-stone-600 hover:bg-stone-700/50 hover:text-amber-300 z-10 text-stone-300"
          on:click={(_) => ($amount = $maxSelectedDenom?.toFixed() ?? "0")}
        >
          <p class="text-stone-500 mr-1">Available:</p>
          {#if $maxSelectedDenom !== undefined}
            <p class="text-inherit">
              {Balance.fromHuman(
                $maxSelectedDenom.toFixed(),
                reserve.rsvDenom
              ).display(2)}
            </p>
          {:else}
            <p class="text-red-500">0.00</p>
          {/if}
        </button>
        {#await status then stats}
          <div
            class="flex flex-col ml-0.5 px-2 text-xs w-full items-start mb-1"
          >
            <hr class="w-full border-stone-600 mb-1" />
            <p class="text-stone-500 mr-1">Receive:</p>
            <p class="text-inherit text-base">
              {Balance.fromAmountDenom(
                $amountRaw.amount
                  .times(stats.reserve_redemption_rate)
                  .toString(),
                reserve.baseDenom
              ).display(6)}
            </p>
          </div>
        {/await}
      {:else}
        <p class="text-center w-full">Withdraw</p>
      {/if}
    </button>
  </div>
  <div use:autoAnimate class="w-full">
    {#if $maxSelectedDenom && new BigNumber($amount).gt($maxSelectedDenom)}
      <div class="flex items-center gap-1 text-red-500 mt-1">
        <OctagonX class="w-4 h-4 inline-block" />
        <p class="text-xs">
          Amount exceeds balance
          <span class="text-stone-500">
            ({formatBigNumber($maxSelectedDenom ?? BigNumber(0), 2)})
          </span>
        </p>
      </div>
    {/if}
    {#await $estimatedFee then fee}
      <div class="flex items-center gap-1 text-stone-500 mt-1">
        <Fuel class="w-4 h-4 inline-block" />
        <p class="text-xs">
          {fee.display(4)} estimated fee
        </p>
      </div>
    {/await}
  </div>

  {#if $selected !== null}
    <div class="flex w-full gap-4 mt-2">
      <button
        class="button flex-1 px-4 py-2"
        on:click={() => {
          txPromise = executeReserveAction();
        }}
      >
        {#if $selected === "provide"}
          Provide
        {:else}
          Withdraw
        {/if}
      </button>
      <button
        class="button flex-1 px-4 py-2"
        on:click={() => {
          $selected = null;
          $amount = "";
        }}
      >
        Cancel
      </button>
    </div>
  {/if}

  <div class="flex items-end justify-between w-full text-xs">
    <p class="text-stone-500">Utilization:</p>
    {#await utilization}
      <p>Loading...</p>
    {:then util}
      <p
        class="bg-gradient-to-tr from-red-600 via-red-500 to-amber-500 text-transparent bg-clip-text font-bold text-sm"
      >
        {util.toFixed(2)}%
      </p>
    {/await}
  </div>
  <div class="flex items-center justify-between w-full text-xs">
    <p class="text-stone-500">Total:</p>
    {#await status}
      <p>Loading...</p>
    {:then stat}
      <p class="text-base">
        {stat.total.display()}
      </p>
    {/await}
  </div>
</div>

<style lang="postcss">
  .button {
    @apply bg-stone-800 border border-stone-600 rounded-md transition-colors;
    @apply hover:bg-stone-700 hover:border-stone-500;
  }
  .button.active {
    @apply bg-stone-800 border-stone-500;
  }
</style>
