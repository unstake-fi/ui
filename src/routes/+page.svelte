<script lang="ts">
  import DenomSelect from "$lib/components/DenomSelect.svelte";
  import NumberInput from "$lib/components/NumberInput.svelte";
  import WalletInfo from "$lib/components/WalletInfo.svelte";
  import Loading from "$lib/components/icons/Loading.svelte";
  import { client, savedNetwork } from "$lib/network/stores";
  import { balances } from "$lib/onchain/queries";
  import type {
    ControllerRates,
    ControllerStatus,
    Offer,
  } from "$lib/onchain/queryTypes";
  import { TxStep, simulate, broadcastTx } from "$lib/onchain/transaction";
  import { refreshing, statusOf } from "$lib/refreshing";
  import { DENOMS } from "$lib/resources/denoms";
  import { msg } from "$lib/resources/msg";
  import {
    CONTROLLERS,
    ICONS,
    MEMO,
    type ControllerConfig,
  } from "$lib/resources/registry";
  import { Balance } from "$lib/wallet/coin";
  import { signer } from "$lib/wallet/stores";
  import { formatBigNumber, calculateFee } from "$lib/wallet/utils";
  import { GasPrice, type DeliverTxResponse } from "@cosmjs/stargate";
  import autoAnimate from "@formkit/auto-animate";
  import { BigNumber } from "bignumber.js";
  import { ChevronsDown, OctagonX, TriangleAlert } from "lucide-svelte";
  import { getContext } from "svelte";
  import { derived, get, writable, type Writable } from "svelte/store";

  const denomMeta = {
    icon: (option: ControllerConfig) => ICONS[option.askDenom],
    label: (option: ControllerConfig) => DENOMS[option.askDenom]?.name,
    filter: (option: ControllerConfig, search: string) =>
      DENOMS[option.askDenom]?.name
        .toLowerCase()
        .includes(search.toLowerCase()),
  };

  $: allControllers = CONTROLLERS[$savedNetwork.chainId];
  const controller = getContext<Writable<string | null>>("controller");
  const selectedConfig = derived(
    [controller, savedNetwork],
    ([$controller, $savedNetwork]) => {
      if ($controller === null) return null;
      return CONTROLLERS[$savedNetwork.chainId][$controller] ?? null;
    }
  );
  const amount = writable("");
  const amountRaw = derived(amount, ($amount) => {
    if (!$amount || !$selectedConfig) return new BigNumber(0);
    const asBalance = Balance.fromHuman($amount, $selectedConfig?.askDenom);
    return asBalance.amount;
  });

  const maxSelectedDenom = derived(
    [signer.resolved, balances.resolved, selectedConfig],
    ([$signer, $balances, $controller]) => {
      if (!$balances || !$controller || !$signer) return undefined;
      return $balances.get($controller.askDenom)?.normalized();
    }
  );

  const denomInputController = writable($selectedConfig);
  $: $denomInputController && ($controller = $denomInputController.address);

  const controllerInfo = refreshing(
    async () => {
      const c = await get(client);
      const addr = get(controller);
      if (!addr) return null;
      const status: Promise<ControllerStatus> = c.wasm.queryContractSmart(
        addr,
        { status: {} }
      );
      const rates: Promise<ControllerRates> = c.wasm.queryContractSmart(addr, {
        rates: {},
      });
      return await Promise.all([status, rates]);
    },
    { refreshOn: [client, controller] }
  );

  const offer = refreshing(
    async () => {
      const c = await get(client);
      const addr = get(controller);
      const amt = get(amountRaw);
      if (!addr) return null;
      if (amt.isNaN() || amt.lte(0)) return null;
      const offer: Offer = await c.wasm.queryContractSmart(addr, {
        offer: { amount: amt.toFixed(0) },
      });

      return {
        amount: Balance.fromAmountDenom(
          offer.amount,
          $selectedConfig!.offerDenom
        ),
        fee: Balance.fromAmountDenom(offer.fee, $selectedConfig!.offerDenom),
      };
    },
    { refreshOn: [client, controller, amountRaw], debounce: 300 }
  );

  const offerRate = refreshing(
    async () => {
      const info = await get(controllerInfo);
      const o = await get(offer);
      const amt = await get(amountRaw);
      if (!info || !o) return null;
      if (amt.isNaN() || amt.lte(0)) return null;
      return o.amount.amount.div(get(amountRaw));
    },
    { refreshOn: [controllerInfo, offer] }
  );

  const feeFraction = derived(offer.resolved, ($offer) => {
    if (!$offer) return null;
    return $offer.fee.amount.div($offer.amount.amount);
  });

  const status = writable<TxStep>(TxStep.None);

  const msgs = refreshing(
    async () => {
      let $client = await get(client);
      let $signer = await get(signer);
      let $balances = await get(balances);
      let $offer = await get(offer);
      if (!$signer || !$selectedConfig || !$offer) return null;
      const controllerAddr = $selectedConfig.address;
      if (!controllerAddr) return null;
      if ($amountRaw.isZero()) return null;
      if (
        $amountRaw.gt(
          $balances.getOrZero($selectedConfig.askDenom).normalized()
        )
      )
        return null;

      const unstakeBal = Balance.fromHuman(
        $amountRaw.toFixed(),
        $selectedConfig.askDenom
      );
      const msgs = [
        msg.wasm.msgExecuteContract({
          sender: $signer.account().address,
          contract: controllerAddr,
          msg: Buffer.from(
            JSON.stringify({
              unstake: {
                max_fee: $offer.fee.amount.toFixed(),
              },
            })
          ),
          funds: unstakeBal.toCoins(),
        }),
      ];
      return msgs;
    },
    { refreshOn: [client, signer, amountRaw, selectedConfig, offer] }
  );

  enum SimulationError {
    WalletDisconnected = "wallet_disconnected",
    ErrorConstructingMsgs = "error_constructing_msgs",
  }

  const { resolved: signerResolved } = signer;
  const { resolved: msgsResolved } = msgs;
  let showGas: boolean = false;
  $: {
    showGas = !!$signerResolved && !!$msgsResolved;
  }

  const txSim = refreshing(
    async () => {
      const s = await get(signer);
      const c = await get(client);
      if (!s) throw SimulationError.WalletDisconnected;
      const m = await get(msgs);
      if (!m) throw SimulationError.ErrorConstructingMsgs;
      return await simulate(c, s.account(), m, MEMO, status);
    },
    { refreshOn: [msgs, signer, client], debounce: 300 }
  );
  const txSimStatus = statusOf(txSim);

  const showError = (err: unknown) => {
    if (err === SimulationError.WalletDisconnected) {
      return false;
    } else if (err === SimulationError.ErrorConstructingMsgs) {
      return false;
    } else {
      return true;
    }
  };

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
  async function executeUnstake() {
    const s = await get(signer);
    const c = await get(client);
    if (!s) throw new Error("No signer connected");
    const sim = await get(txSim);
    const m = await get(msgs);
    return await broadcastTx(c, s, sim, m!, MEMO, status).then((res) => {
      balances.reload();
      $amount = "";
      return res;
    });
  }
</script>

<div class="mt-20">
  <div class="mx-auto max-w-prose">
    <img src="/unstake-name.svg" class="h-20" alt="Unstake.fi Logo" />
    <h1 class="text-slate-100 mt-8 mb-2 text-center text-4xl font-light">
      Don't Wait. <span
        class="bg-gradient-to-tr from-red-600 via-red-500 to-amber-500 text-transparent bg-clip-text font-semibold"
      >
        Unstake.
      </span>
    </h1>

    <div class="mt-8 items-center">
      <div
        class={`bg-neutral-800 rounded-md px-4 py-2 text-stone-200 w-full ${
          $maxSelectedDenom && new BigNumber($amount).gt($maxSelectedDenom)
            ? "border border-red-500"
            : ""
        }`}
        use:autoAnimate={{ duration: 100 }}
      >
        <label
          for="unbondAmount"
          class="block text-sm font-semibold leading-6 text-stone-400"
        >
          You unstake
        </label>
        <div class="flex flex-row items-center">
          <NumberInput
            bind:value={$amount}
            id="unbondAmount"
            class="bg-inherit pt-2 pb-2 text-lg focus:outline-none flex-grow"
          />
          <DenomSelect
            items={Object.values(allControllers)}
            meta={denomMeta}
            bind:active={$denomInputController}
            class="bg-neutral-800 text-left text-stone-200"
          />
        </div>
        <div class="flex justify-between">
          <div
            class="flex flex-col gap-0.5 text-xs text-stone-300"
            use:autoAnimate
          >
            <div class="flex items-center">
              <p class="text-stone-500">Available:</p>
              {#if $maxSelectedDenom !== undefined}
                <button
                  class="ml-1 hover:text-amber-300"
                  on:click={(_) => ($amount = $maxSelectedDenom.toFixed())}
                  use:autoAnimate
                >
                  {formatBigNumber($maxSelectedDenom, 2)}
                </button>
              {:else}
                <p class="ml-1 text-red-500">0.00</p>
              {/if}
            </div>
            {#if $maxSelectedDenom !== undefined}
              <div class="flex items-center gap-1">
                <button
                  class="border border-amber-600 bg-red-800/50 px-1 -ml-0.5 rounded-md hover:text-amber-300 hover:bg-red-700/50"
                  on:click={(_) => ($amount = $maxSelectedDenom.toFixed())}
                >
                  100%
                </button>
                <button
                  class="border border-amber-600 bg-red-800/50 px-1 rounded-md hover:text-amber-300 hover:bg-red-700/50"
                  on:click={(_) =>
                    ($amount = $maxSelectedDenom.div(2).toFixed())}
                >
                  50%
                </button>
                <button
                  class="border border-amber-600 bg-red-800/50 px-1 rounded-md hover:text-amber-300 hover:bg-red-700/50"
                  on:click={(_) =>
                    ($amount = $maxSelectedDenom.div(4).toFixed())}
                >
                  25%
                </button>
                <button
                  class="border border-amber-600 bg-red-800/50 px-1 rounded-md hover:text-amber-300 hover:bg-red-700/50"
                  on:click={(_) => ($amount = "0")}
                >
                  0%
                </button>
              </div>
            {/if}
          </div>
          <div class="flex flex-col items-end mr-1">
            <p class="text-xs text-stone-500 -mb-1 mt-1">Protocol Rate</p>
            {#await $controllerInfo}
              <p class="text-sm">-</p>
            {:then res}
              {#if res && $selectedConfig}
                {@const [_, rates] = res}
                <p class="text-sm">
                  {Balance.fromHuman(
                    rates.provider_redemption,
                    $selectedConfig.offerDenom
                  ).display(4)}
                </p>
              {:else}
                <p class="text-sm">-</p>
              {/if}
            {:catch _}
              <p class="text-sm text-red-500">-</p>
            {/await}
          </div>
        </div>
      </div>
      <div class="flex justify-center w-full">
        <div class="p-2 -my-3.5 bg-stone-950 rounded-md z-10">
          <ChevronsDown class="w-5 h-5 text-stone-400" />
        </div>
      </div>
      <div
        class={`bg-neutral-800 rounded-md px-4 py-2 text-stone-200 w-full ${
          $feeFraction && $feeFraction.gt(0.05) ? "border border-amber-500" : ""
        }`}
      >
        <p class="block text-sm font-semibold leading-6 text-stone-400">
          You receive
        </p>
        <div class="flex flex-row items-center">
          {#await $offer}
            <div class="py-4 flex-grow">
              <Loading class="w-7 h-7 fill-stone-400" />
            </div>
          {:then offer}
            {#if offer}
              <p class="py-4 text-lg flex-grow text-stone-400">
                {offer.amount.humanAmount(4)}
              </p>
            {:else}
              <p class="py-4 text-lg flex-grow text-stone-400">-</p>
            {/if}
          {:catch e}
            <p class="py-4 text-lg flex-grow text-red-500">-</p>
          {/await}

          <div class="flex flex-col">
            <div
              class="flex space-x-2 items-center h-full text-stone-200 px-4 rounded-md"
            >
              {#if $selectedConfig !== null}
                <svelte:component
                  this={ICONS[$selectedConfig.offerDenom]}
                  class="w-6 h-6"
                />
                <p>{DENOMS[$selectedConfig.offerDenom].name}</p>
              {/if}
            </div>

            <div class="flex flex-col items-end mr-1">
              <p class="text-xs text-stone-500 -mb-1 mt-1">Unstake Rate</p>
              {#await $offerRate}
                <p class="text-sm">-</p>
              {:then offerRate}
                {#if offerRate && $selectedConfig}
                  <p class="text-sm">
                    {offerRate.toFixed(4)}
                    {Balance.fromHuman("0", $selectedConfig.offerDenom).name}
                  </p>
                {:else}
                  <p class="text-sm">-</p>
                {/if}
              {:catch _}
                <p class="text-sm text-red-500">-</p>
              {/await}
            </div>
          </div>
        </div>
      </div>
      {#if $maxSelectedDenom && new BigNumber($amount).gt($maxSelectedDenom)}
        <div class="flex items-center gap-1 text-red-500 mt-1">
          <OctagonX class="w-4 h-4 inline-block" />
          <p class="text-xs">
            Input amount exceeds available balance
            <span class="text-stone-500">
              ({formatBigNumber($maxSelectedDenom, 2)})
            </span>
          </p>
        </div>
      {/if}
      {#if $feeFraction && $feeFraction.gt(0.05)}
        <div class="flex items-center gap-1 text-amber-500 mt-1">
          <TriangleAlert class="w-4 h-4 inline-block" />
          <p class="text-xs">
            High slippage
            <span class="text-stone-500">
              ({formatBigNumber($feeFraction.times(100), 2)}%)
            </span>
          </p>
        </div>
      {/if}
      <div
        class="flex justify-between my-2 gap-2 text-sm text-stone-400 items-center"
      >
        <button
          class="flex-grow border border-stone-500 bg-stone-700 hover:bg-gradient-to-tr from-red-700 via-red-500 to-amber-500 px-4 py-2 rounded-md my-2 text-stone-200 hover:border-stone-400"
          id="submit"
        >
          <label
            for="submit"
            class="flex items-center justify-center cursor-pointer"
          >
            <p class="text-base">Unstake</p>
          </label>
        </button>
        <WalletInfo />
      </div>
    </div>
  </div>
</div>
