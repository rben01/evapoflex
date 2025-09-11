<script lang="ts">
	import Graph from "$lib/components/Graph.svelte";
	import RangeWithAxis from "$lib/components/RangeWithAxis.svelte";

	let latitude = $state(0);
	let airTemperature = $state(20);
	let windSpeed = $state(5);
	let relativeHumidity = $state(50);

	// Graphs will use placeholder data for now

	const fmt = (n: number) => `${Math.round(n)}`;
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
		<div class="graphs-grid">
			<Graph title="Relative Humidity" units="%" yAxisMax={100} fillColor="#4682b4" currentValue={65} />
			<Graph title="Air Temperature" units="°C" yAxisMax={40} fillColor="#e67e22" currentValue={22} />
			<div class="span-2">
				<Graph title="Wind Speed" units="mph" yAxisMax={15} fillColor="#16a085" currentValue={8} />
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
		grid-template-columns: 280px 1fr;
		gap: 12px; /* narrower gap between sidebar and graph */
		align-items: start;
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
		overflow: auto;
		min-width: 0; /* prevent grid overflow */
	}

	.graphs-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
		align-items: start;
	}
	.graphs-grid .span-2 { grid-column: 1 / -1; }

	/* Remove space after the last slider */
	:global(.sidebar > .control:last-child) {
		margin-bottom: 0;
	}

	@media (max-width: 800px) {
		.layout {
			grid-template-columns: 1fr;
			gap: 16px;
		}

		.graphs-grid { grid-template-columns: 1fr; }
	}
</style>
