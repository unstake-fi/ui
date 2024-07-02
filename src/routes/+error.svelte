<script lang="ts">
  import { page } from "$app/stores";
</script>

<svelte:head>
  <title>{$page.status && `${$page.status} | `}UNSTAKE.FI</title>
</svelte:head>

<div
  class="flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
>
  <div class="mx-auto text-center">
    <h1
      class="mt-4 text-3xl font-bold tracking-tight sm:text-4xl text-slate-100"
    >
      {#if $page.status === 404}
        Page Not Found (404)
      {:else}
        Something went wrong ({$page.status})
      {/if}
    </h1>
    <p class="mt-4 text-stone-400">
      {#if $page.status === 404}
        The page you're looking for could not be found
      {:else}
        An unexpected error occurred.
      {/if}
    </p>
    <a
      href="/"
      class="inline-block border border-stone-500 bg-stone-700 from-red-700 via-red-500 to-amber-500 px-4 py-2 rounded-md my-2 text-stone-200 hover:border-stone-400 mt-4"
    >
      Home
    </a>
  </div>
</div>
