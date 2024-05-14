<script lang="ts">
  import { Check, X } from "lucide-svelte";
  import { createDialog, melt, type CreateDialogProps } from "@melt-ui/svelte";
  import { SonarURI } from "$lib/wallet/adapters/sonar";
  import QR from "$lib/wallet/components/QR.svelte";
  import IconSonar from "$lib/wallet/icons/IconSonar.svelte";
  import { writable, type Writable } from "svelte/store";
  import type { Connectable, WalletAdapter } from "$lib/wallet/adapters/types";
  import { WALLETS, adapterToIWallet } from "$lib/wallet/adapters";
  import { savedAdapter } from "$lib/wallet/stores";
  import { savedNetwork } from "$lib/network/stores";
  import { MAINNET } from "$lib/resources/networks";
  import autoAnimate from "@formkit/auto-animate";
  import Loading from "./icons/Loading.svelte";

  export let open = writable(false);

  const {
    elements: { portalled, overlay, content, close },
  } = createDialog({
    role: "alertdialog",
    open,
  });

  let installedWallets: Writable<Connectable[]> = writable([]);
  let uninstalledWallets: Writable<Connectable[]> = writable([]);
  WALLETS.map(async (adapter: WalletAdapter) => {
    const wallet = await adapterToIWallet(adapter);
    if (!wallet) return;
    if (await wallet.isInstalled()) {
      installedWallets.update((w) => [...w, wallet]);
    } else {
      uninstalledWallets.update((w) => [...w, wallet]);
    }
  });

  let connectPromise: Promise<unknown> | null | "done" = null;

  $: if ($open) {
    connectPromise = null;
  }
</script>

<div use:melt={$portalled}>
  {#if $open}
    <div use:melt={$overlay} class="overlay" />
    <div use:melt={$content} class="content">
      <button
        use:melt={$close}
        aria-label="close"
        class="absolute right-2 top-2 inline-flex appearance-none
                  items-center justify-center rounded-full"
      >
        <X class="w-6 h-6" />
      </button>
      <div
        class="flex flex-col w-full h-full items-start space-y-2"
        use:autoAnimate
      >
        <h1 class="text-xl -mt-6">Connect Wallet</h1>
        {#if connectPromise === null}
          <div class="flex flex-col space-y-2">
            <div>
              <p class="text-sm text-stone-400">Available</p>
              <div class="flex flex-row space-x-2">
                {#each $installedWallets as { metadata: { name, logo, adapter: type }, connect } (type)}
                  <button
                    class="wallet-option button"
                    class:active={$savedAdapter === type}
                    title="Connect with {name}"
                    on:click={() => {
                      connectPromise = connect(
                        $savedNetwork.chainId ?? MAINNET
                      ).then((_) => {
                        savedAdapter.set(type);
                        connectPromise = "done";
                      });
                    }}
                  >
                    <div class="flex flex-col items-center mx-auto my-auto">
                      <svelte:component this={logo} class="w-7 h-7" />
                      <p class="text-sm">{name}</p>
                    </div>
                  </button>
                {/each}
              </div>
            </div>
            {#if $uninstalledWallets.length > 0}
              <div>
                <p class="text-sm text-stone-400">Undetected</p>
                <div class="flex flex-row space-x-2">
                  {#each $uninstalledWallets as { metadata: { name, logo, adapter: type } } (type)}
                    <button
                      class="wallet-option button"
                      class:active={$savedAdapter === type}
                      disabled
                      title="{name} not detected"
                    >
                      <div class="flex flex-col items-center mx-auto my-auto">
                        <svelte:component this={logo} class="w-7 h-7" />
                        <p class="text-sm">{name}</p>
                      </div>
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {:else}
          <div class="flex flex-col justify-center items-center w-full xs:py-12">
            {#await connectPromise}
              {#if $SonarURI !== null}
                <div class="flex flex-col xs:flex-row w-full h-full items-center gap-4">
                  <div class="basis-1/2">
                    <QR
                      uri={$SonarURI}
                      rounding={150}
                      color="#fff"
                      backgroundColor="transparent"
                      cutout
                      class="w-64"
                    >
                      <IconSonar class="object-contain w-full h-full" />
                    </QR>
                  </div>
                  <div class="flex flex-col gap-4 basis-1/2 items-start">
                    <svg
                      class="h-16 hidden xs:visible"
                      viewBox="0 0 467 141"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      xmlns:xlink="http://www.w3.org/1999/xlink"
                    >
                      <g
                        id="Sonar-Solo"
                        stroke="none"
                        stroke-width="1"
                        fill="none"
                        fill-rule="evenodd"
                      >
                        <g
                          id="Sonar"
                          transform="translate(61.175257, -0.000000)"
                          fill-rule="nonzero"
                        >
                          <path
                            d="M126.940852,65.4749867 C126.588492,81.966286 105.642476,118.407441 89.4071617,126.24557 C73.1718475,134.083699 43.1077416,121.302209 29.5289667,112.503759 C15.9501917,103.70531 8.48110966,89.7363488 7.93451207,73.4548736 C7.38791448,57.1733984 12.3182468,22.5077582 26.2493811,14.8149083 C40.1805155,7.12205832 74.7394065,18.8544275 91.5213183,27.2977739 C108.30323,35.7411203 127.293211,48.9836874 126.940852,65.4749867 C126.588492,81.966286 105.642476,118.407441 89.4071617,126.24557"
                            id="Path"
                            fill="#60FBD0"
                            opacity="0.6"
                          />
                          <path
                            d="M127.974753,59.5978845 C126.883487,82.0021364 112.944644,123.849402 98.6748751,135.064346 C84.4051063,146.27929 57.6672904,140.507595 42.3561405,126.887547 C27.0449907,113.267498 7.65693145,69.5251399 6.80797605,53.3440555 C5.95902066,37.162971 20.8599921,38.5852433 37.2624082,29.8010398 C53.6648242,21.0168363 90.1037482,-4.32730651 105.222472,0.638834271 C120.341197,5.60497505 129.06602,37.1936325 127.974753,59.5978845 C126.883487,82.0021364 112.944644,123.849402 98.6748751,135.064346"
                            id="Path"
                            fill="#1E92E6"
                            opacity="0.35"
                          />
                          <path
                            d="M134.797571,69.4616194 C135.973631,85.4956657 112.277349,106.94892 95.6566269,116.150671 C79.0359049,125.352422 51.015923,131.936995 35.0732383,124.672126 C19.1305536,117.407257 0.117572844,90.1118158 7.10542736e-15,72.5614578 C-0.116535543,55.0110998 19.6042885,28.1391558 34.3709131,19.3699784 C49.1375378,10.600801 71.8624903,11.5977865 88.6002665,19.9463933 C105.338043,28.2950001 133.621511,53.4275731 134.797571,69.4616194 C135.973631,85.4956657 112.277349,106.94892 95.6566269,116.150671"
                            id="Path"
                            fill="#1E92E6"
                            opacity="0.45"
                          />
                          <g
                            id="Group"
                            transform="translate(67.419855, 70.500000) rotate(-180.000000) translate(-67.419855, -70.500000) translate(31.069967, 34.159765)"
                            fill="#FFFFFF"
                          >
                            <path
                              d="M54.5173552,36.3413025 C54.5173552,31.5226287 52.6022263,26.9004574 49.1935183,23.4936011 C45.7855405,20.0857308 41.162123,18.1711992 36.3423527,18.1711992 C31.5225825,18.1711992 26.8989621,20.0858119 23.4911872,23.4936011 C20.082398,26.9006602 18.1673502,31.5228314 18.1673502,36.3413025 C18.1673502,41.1597735 20.0824792,45.7821475 23.4911872,49.1890039 C26.899165,52.5968742 31.5225825,54.5114058 36.3423527,54.5114058 C41.162123,54.5114058 45.7857433,52.5967931 49.1935183,49.1890039 C52.6023074,45.7819448 54.5173552,41.1597735 54.5173552,36.3413025 Z M27.2551557,36.3413025 C27.2551557,33.93156 28.2131259,31.6209813 29.9166685,29.9169448 C31.6210225,28.2138411 33.9323662,27.2561494 36.3427584,27.2561494 C38.7531506,27.2561494 41.0643523,28.2138614 42.7688483,29.9169448 C44.4724112,31.6208394 45.4303611,33.93156 45.4303611,36.3413025 C45.4303611,38.751045 44.4723909,41.0616236 42.7688483,42.7656602 C41.0644943,44.4687639 38.7531506,45.4264555 36.3427584,45.4264555 C33.9323662,45.4264555 31.6211645,44.4687436 29.9166685,42.7656602 C28.2131056,41.0617656 27.2551557,38.751045 27.2551557,36.3413025 Z"
                              id="Shape"
                            />
                            <path
                              d="M17.0318309,12.4933081 C17.0318309,15.0020116 14.9971053,17.0361888 12.4877254,17.0361888 C9.97834537,17.0361888 7.94443113,15.0020116 7.94443113,12.4933081 C7.94443113,9.98460453 9.97834537,7.95123854 12.4877254,7.95123854 C14.9971053,7.95123854 17.0318309,9.98460453 17.0318309,12.4933081"
                              id="Path"
                            />
                            <path
                              d="M36.3425556,0.00150149748 C34.1674621,0.00467007667 31.9964255,0.202706783 29.8562211,0.591658243 C28.6439052,0.777019619 27.5584071,1.44400097 26.8452085,2.44131761 C26.1320911,3.43942513 25.8523898,4.6823396 26.0702846,5.88873177 C26.2881793,7.09512393 26.9846636,8.16301117 28.0012556,8.84823543 C29.0178476,9.53423029 30.2690487,9.77980785 31.469478,9.52948502 C39.1418398,8.1345193 47.044835,10.0919002 53.1798441,14.9058288 C59.3134333,19.7196357 63.0922095,26.929801 63.5597643,34.7118315 C64.0264672,42.493862 61.1382156,50.1039273 55.6235027,55.6173565 C50.1093983,61.1307857 42.4972811,64.0180964 34.7123409,63.5514788 C26.9282122,63.0841108 19.7161028,59.3062924 14.900998,53.1743566 C10.0858931,47.0416096 8.12784244,39.1407447 9.52320457,31.4698427 C9.76329043,29.894273 9.16108792,28.3083611 7.93453235,27.2897516 C6.70795651,26.2718519 5.03772082,25.9700409 3.53302591,26.4960149 C2.028331,27.021198 0.908633523,28.2973496 0.583069311,29.8570409 C-0.748883863,37.2026693 0.21383284,44.7802884 3.34133857,51.559527 C6.46797207,58.3387655 11.6080326,63.9906996 18.0617092,67.7461504 C24.5153858,71.5024123 31.9690821,73.180289 39.4110135,72.5512374 C46.8521335,71.9230577 53.9190067,69.0182462 59.6501539,64.2328298 C65.3821125,59.4474134 69.5000434,53.0137274 71.4451121,45.8059955 C73.390343,38.5982637 73.0670709,30.9658915 70.5212197,23.9473619 C67.9745164,16.929035 63.3273662,10.8658447 57.212033,6.58111448 C51.0973082,2.29638426 43.8101467,-0.00162145416 36.3434684,0 L36.3425556,0.00150149748 Z"
                              id="Path"
                            />
                          </g>
                        </g>
                        <g
                          id="SONAR"
                          transform="translate(0.000000, 36.000000)"
                          fill="#FFFFFF"
                          fill-rule="nonzero"
                        >
                          <path
                            d="M27.1,69 C45.1,69 52.9,59.5 52.9,48.4 C52.9,23.5 14.1,31.2 14.1,18.8 C14.1,13.8 18.5,10.5 25.4,10.5 C32.4,10.5 39.5,12.9 44.7,18.1 L51.4,9.4 C45.2,3.4 36.8,0.1 26.4,0.1 C11.8,0.1 2.1,8.6 2.1,19.6 C2.1,44.2 41,35.5 41,49.5 C41,53.9 37.2,58.6 27.6,58.6 C18.3,58.6 11.1,54.3 6.5,49.4 L-2.27373675e-13,58.4 C5.9,64.7 14.8,69 27.1,69 Z"
                            id="Path"
                          />
                          <polygon
                            id="Path"
                            points="265.857143 67.8 265.857143 1.1 254.157143 1.1 254.157143 47.4 220.057143 1.1 208.057143 1.1 208.057143 67.8 219.757143 67.8 219.757143 20.2 254.557143 67.8"
                          />
                          <path
                            d="M373.985714,67.8 L347.785714,1.1 L333.185714,1.1 L306.985714,67.8 L320.285714,67.8 L325.185714,55 L355.785714,55 L360.685714,67.8 L373.985714,67.8 Z M352.485714,44.7 L328.485714,44.7 L340.485714,12.9 L352.485714,44.7 Z"
                            id="Shape"
                          />
                          <path
                            d="M466.814286,67.8 L450.514286,41.6 C458.514286,40.3 466.314286,33.9 466.314286,22 C466.314286,9.7 457.714286,1.1 444.514286,1.1 L415.214286,1.1 L415.214286,67.8 L426.914286,67.8 L426.914286,42.9 L438.514286,42.9 L453.314286,67.8 L466.814286,67.8 Z M442.914286,32.6 L426.914286,32.6 L426.914286,11.4 L442.914286,11.4 C449.514286,11.4 454.314286,15.6 454.314286,22 C454.314286,28.4 449.514286,32.6 442.914286,32.6 Z"
                            id="Shape"
                          />
                        </g>
                      </g>
                    </svg>
                    <div class="flex flex-col gap-2 text-left items-start w-64">
                      <p class="text-gray-400 min-w-0 break-words">
                        Scan this code using the Sonar Mobile App.
                      </p>
                      <a
                        class="button anchor-primary py-2 px-4 text-gray-300 bg-stone-800"
                        href="https://sonar.kujira.network"
                      >
                        Download Sonar
                      </a>
                    </div>
                    <button
                      class="button px-2 py-1 bg-stone-800"
                      on:click={() => {
                        connectPromise = null;
                        $SonarURI = null;
                      }}
                    >
                      Back
                    </button>
                  </div>
                </div>
              {:else}
                <Loading class="w-7 h-7 fill-stone-200" />
                <p>Connecting...</p>
              {/if}
            {:then}
              <Check class="w-7 h-7 text-lime-600" />
              <p>Connected</p>
              <button
                class="button px-2 py-1 bg-stone-800 mt-2"
                on:click={() => ($open = false)}
              >
                Done
              </button>
            {:catch}
              <p>Failed to connect</p>
              <button
                class="button px-2 py-1 bg-stone-800 mt-2"
                on:click={() => {
                  connectPromise = null;
                  $SonarURI = null;
                }}
              >
                Back
              </button>
            {/await}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style lang="postcss">
  .content {
    @apply m-0 p-6 pt-8 fixed z-50 xs:min-w-96;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%);
    @apply rounded-md bg-stone-900 text-inherit overflow-visible;
  }
  .overlay {
    @apply fixed inset-0 z-50 bg-black/50 backdrop-blur-sm;
  }

  .button {
    @apply rounded-md border border-neutral-600 flex flex-col items-center transition-colors;
    @apply hover:border-neutral-500 hover:bg-stone-700;
  }
  .wallet-option {
    @apply justify-center w-16 h-16;
  }
  .active {
    @apply border-blue-500;
  }
  .wallet-option:disabled {
    @apply opacity-30 bg-neutral-600;
  }
</style>
