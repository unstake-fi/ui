<script lang="ts">
  import { setupEventListeners } from "$lib/wallet/adapters";
  import { writable } from "svelte/store";
  import "../app.css";
  import { browser, dev } from "$app/environment";
  import { page } from "$app/stores";
  import { CONTROLLERS } from "$lib/resources/registry";
  import { savedNetwork } from "$lib/network/stores";
  import { goto } from "$app/navigation";
  import { setContext } from "svelte";

  let PUBLIC_ANALYTICS_ID: string | null = null;
  let PUBLIC_ANALYTICS_URL: string | null = null;
  if (!dev) {
    import("$env/static/public").then((env: any) => {
      if (env["PUBLIC_ANALYTICS_ID"] && env["PUBLIC_ANALYTICS_URL"]) {
        PUBLIC_ANALYTICS_ID = env.PUBLIC_ANALYTICS_ID;
        PUBLIC_ANALYTICS_URL = env.PUBLIC_ANALYTICS_URL;
      }
    });
  }

  setupEventListeners();

  const controllers = Object.keys(CONTROLLERS[$savedNetwork.chainId]);
  const defaultController = controllers.length > 0 ? controllers[0] : null;

  const controller = writable(
    browser
      ? $page.url.searchParams.get("controller") ?? defaultController
      : defaultController
  );
  $: {
    if (browser && $controller) {
      const nextUrl = new URLSearchParams($page.url.searchParams.toString());
      nextUrl.set("controller", $controller);
      goto(`?${nextUrl.toString()}`);
    }
  }
  setContext("controller", controller);
</script>

<svelte:head>
  {#if !dev}
    <script
      async
      defer
      data-website-id={PUBLIC_ANALYTICS_ID}
      src={PUBLIC_ANALYTICS_URL}
    ></script>
  {/if}
</svelte:head>

<slot />

<style lang="postcss">
  :global(html) {
    @apply bg-stone-950;
    @apply text-gray-200 min-h-screen subpixel-antialiased;
  }
</style>
