<script lang="ts">
  import IconCheckAnimated from "$lib/components/icons/IconCheckAnimated.svelte";
  import IconXAnimated from "$lib/components/icons/IconXAnimated.svelte";
  import Loading from "./icons/Loading.svelte";
  export let message: string;
  export let status: "pending" | "success" | "failed";
</script>

<div class="flex items-center space-x-2">
  {#if status === "pending"}
    <Loading class="w-6 h-6 fill-gray-200" />
    <p class="text-sm text-stone-400">{message}</p>
  {:else if status === "failed"}
    <IconXAnimated class="w-6 h-6 text-red-500" />
    <p class="text-sm text-red-500">{message}</p>
  {:else}
    <IconCheckAnimated class="w-6 h-6 text-lime-600" />
    <p class="text-sm text-lime-600">{message}</p>
  {/if}
</div>
