<script lang="ts">
	import Graph from "$lib/components/Graph.svelte";
	import RangeWithAxis from "$lib/components/RangeWithAxis.svelte";

	let latitude = $state(0);
	let airTemperature = $state(20);
	let windSpeed = $state(5);
	let relativeHumidity = $state(50);

	// Graphs will use placeholder data for now

	const fmt = (n: number) => `${Math.round(n)}`;

	// Calculate height for each individual graph to prevent scrolling
	let graphsContainer: HTMLDivElement;
	let individualGraphHeight = $state(200);
	let isDesktop = $state(true);

	function calculateGraphHeights() {
		if (!graphsContainer) return;

		const viewportHeight = window.innerHeight;
		const isWideScreen = window.innerWidth >= 800;
		isDesktop = isWideScreen;

		if (!isWideScreen) {
			// On mobile, use fixed height per graph
			individualGraphHeight = 280;
			return;
		}

		// Calculate space taken by other elements
		const containerTop = graphsContainer.getBoundingClientRect().top;
		const bottomPadding = 40; // Extra buffer for any margins/padding
		const gap = 12 * 2; // 12px gap between 3 graphs = 24px total
		const firstGraphPadding = 16; // Only first graph has top padding
		const availableHeight = viewportHeight - containerTop - bottomPadding;

		// Calculate ideal height per graph
		const idealHeight = Math.floor(
			(availableHeight - gap - firstGraphPadding) / 3,
		);

		// Set minimum height to prevent overlapping - prefer scrolling over overlap
		const minGraphHeight = 180;
		individualGraphHeight = Math.max(minGraphHeight, idealHeight);
	}

	$effect(() => {
		if (!graphsContainer) return;

		const onResize = () => {
			// Small delay to ensure DOM has updated
			requestAnimationFrame(() => calculateGraphHeights());
		};

		// Initial calculation
		calculateGraphHeights();

		// Listen to window resize
		window.addEventListener("resize", onResize);

		// Also use ResizeObserver for more reliable detection
		const resizeObserver = new ResizeObserver(() => {
			requestAnimationFrame(() => calculateGraphHeights());
		});
		resizeObserver.observe(graphsContainer);

		return () => {
			window.removeEventListener("resize", onResize);
			resizeObserver.disconnect();
		};
	});
</script>

<svelte:head>
	<title>Evaporation-Powered Engine Power Analysis</title>
	<meta name="description" content="A SvelteKit app with D3 visualization" />
</svelte:head>

<h1>Evaporation-Powered Engine Power Analysis</h1>

<section class="layout">
	<div class="sidebar">
		<RangeWithAxis
			label="Latitude (°)"
			min={-90}
			max={90}
			step={1}
			bind:value={latitude}
			format={fmt}
		/>
		<RangeWithAxis
			label="Air Temperature (°C)"
			min={-20}
			max={40}
			step={1}
			bind:value={airTemperature}
			format={fmt}
		/>
		<RangeWithAxis
			label="Wind Speed (mph)"
			min={0}
			max={15}
			step={1}
			bind:value={windSpeed}
			format={fmt}
		/>
		<RangeWithAxis
			label="Relative Humidity (%)"
			min={0}
			max={100}
			step={1}
			bind:value={relativeHumidity}
			format={fmt}
		/>
	</div>
	<div class="main">
		<div class="graphs-stack" bind:this={graphsContainer}>
			<div
				class="graph-item first-graph"
				style={`height: ${individualGraphHeight}px`}
			>
				<Graph
					title="Relative Humidity"
					units="%"
					yAxisMax={100}
					fillColor="#4682b4"
					currentValue={relativeHumidity}
				/>
			</div>
			<div class="graph-item" style={`height: ${individualGraphHeight}px`}>
				<Graph
					title="Air Temperature"
					units="°C"
					yAxisMax={40}
					fillColor="#e67e22"
					currentValue={airTemperature}
				/>
			</div>
			<div class="graph-item" style={`height: ${individualGraphHeight}px`}>
				<Graph
					title="Wind Speed"
					units="mph"
					yAxisMax={15}
					fillColor="#16a085"
					currentValue={windSpeed}
				/>
			</div>
		</div>
	</div>
</section>

<style>
	h1 {
		text-align: center;
		color: #2c3e50;
		margin-bottom: 16px;
		font-size: 2rem;
		font-weight: 400;
	}

	.layout {
		display: grid;
		grid-template-columns: 280px minmax(0, 1fr);
		gap: 12px;
		align-items: start;
		width: 100%;
		box-sizing: border-box;
	}

	.sidebar {
		background: #fafafa;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		padding: 16px 30px 16px 30px;
		margin-top: 16px;
		top: 12px;
		min-width: 0; /* prevent grid overflow on small screens */
	}

	.main {
		min-width: 0;
		width: 100%;
		box-sizing: border-box;
	}

	.graphs-stack {
		display: flex;
		flex-direction: column;
		gap: 12px;
		/* Remove any height constraints - let individual graphs determine total height */
	}

	.graph-item {
		display: flex;
		flex-direction: column;
		width: 100%;
		box-sizing: border-box;
		flex-shrink: 0; /* Prevent shrinking below set height - critical for preventing overlap */
	}

	/* First graph gets top padding to align with sidebar */
	.first-graph :global(.graph-container) {
		padding-top: 16px;
	}

	/* Ensure Graph component fills the available space */
	.graph-item :global(.graph-container) {
		height: 100%;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
	}

	.graph-item :global(.chart) {
		flex: 1;
		width: 100%;
		box-sizing: border-box;
	}

	/* Remove space after the last slider */
	:global(.sidebar > .control:last-child) {
		margin-bottom: 0;
	}

	@media (max-width: 800px) {
		.layout {
			grid-template-columns: 1fr;
			gap: 16px;
		}
	}
</style>
