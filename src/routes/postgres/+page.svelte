<script lang="ts">
	import type { PageData } from './$types';
	
	export let data: PageData = [];
    console.log(data);
</script>

<h1>Data from PostgreSQL</h1>

<ul>
    {#each data.data as row}
        <li>{row}</li>
    {/each}
</ul>