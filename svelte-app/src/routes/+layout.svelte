<script lang="ts">
	import type { Snippet } from "svelte";
	import "../app.css";

	let { children }: { children?: Snippet } = $props();
</script>

<main>
	{@render children?.()}
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
		background-color: white; /* full-bleed page background */
	}

	main {
		--horizontal-padding: 20px;
		width: calc(100% - 2 * var(--horizontal-padding));
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--horizontal-padding);
		background-color: transparent; /* let body provide background */
		box-shadow: none;
	}
</style>
