<script lang="ts">
	import Graph from "$lib/components/Graph.svelte";
	import RangeWithAxis from "$lib/components/RangeWithAxis.svelte";

  let latitude = $state(0);
  let airTemperature = $state(20);
  let windSpeed = $state(5);
  let relativeHumidity = $state(50);

  // Example: show Relative Humidity as the active metric for now
  const title = $derived(() => "Relative Humidity");
  const units = $derived(() => "%");
  const yAxisMax = $derived(() => 100);
  const fillColor = $derived(() => "#4682b4");
  const currentValue = $derived(() => Math.max(0, Math.min(100, relativeHumidity)));

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
    <Graph {title} {units} {yAxisMax} {fillColor} {currentValue} />
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
