<script lang="ts">
	import Graph from "$lib/components/Graph.svelte";
	import RangeWithAxis from "$lib/components/RangeWithAxis.svelte";
	import {
		calculateDelta,
		calculateEvaporationRate,
		calculatePowerPerArea,
		SPECIFIC_LATENT_HEAT_OF_VAPORIZATION_WATER,
		type VaporPressureMethod,
	} from "$lib/calculations.js";

	let irradiance = $state(500);
	let airTemperatureDegC = $state(20);
	let windSpeedMps = $state(4);
	let relativeHumidityPct = $state(5);
	let vaporPressureMethod = $state<VaporPressureMethod>("buck");

	// Calculate derived values for the graphs
	const airTemperatureK = $derived(airTemperatureDegC + 273.15);
	const relativeHumidityFraction = $derived(relativeHumidityPct / 100);

	// Thermodynamic calculations
	const delta = $derived(
		calculateDelta({
			T: airTemperatureK,
			method: vaporPressureMethod,
		}),
	);
	const evaporationRate = $derived(
		calculateEvaporationRate({
			R_n: irradiance,
			delta: delta,
			u_a: windSpeedMps,
			T_mean: airTemperatureK,
			relHum: relativeHumidityFraction,
			method: vaporPressureMethod,
		}),
	);
	// We have latent heat (L_v, J/g), evap. rate (Er, mm/day), density of water (1 g/cm^3). Want
	// W/m^2. \
	// (L_v [J/g])(Er [mm/day])(day/(24*3600s))(0.1 cm/mm)(1 g/cm^3)(100 cm/m)^2
	// = L_v * Er * (1k / (24*3600))
	const totalLatentEnergy = $derived(
		(evaporationRate * SPECIFIC_LATENT_HEAT_OF_VAPORIZATION_WATER * 1000) /
			(24 * 3600),
	);
	const maxEnginePower = $derived(
		calculatePowerPerArea({
			evapRate: evaporationRate,
			T_air: airTemperatureK,
			relHumWet: 0.975,
			relHumAir: relativeHumidityFraction,
		}),
	);

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
			label="Radiation"
			units="W/m²"
			min={0}
			max={1000}
			step={25}
			bind:value={irradiance}
			format={fmt}
		/>
		<RangeWithAxis
			label="Air Temperature"
			units="&VeryThinSpace;°C"
			min={-20}
			max={40}
			step={1}
			bind:value={airTemperatureDegC}
			format={fmt}
		/>
		<RangeWithAxis
			label="Wind Speed"
			units="&VeryThinSpace;m/s"
			min={0}
			max={15}
			step={1}
			bind:value={windSpeedMps}
			format={fmt}
		/>
		<RangeWithAxis
			label="Relative Humidity"
			units="&VeryThinSpace;%"
			min={5}
			max={95}
			step={1}
			bind:value={relativeHumidityPct}
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
					title="Total Latent Energy"
					units="W/m²"
					yAxisMax={1750}
					fillColor="#e74c3c"
					currentValue={totalLatentEnergy}
				/>
			</div>
			<div class="graph-item" style={`height: ${individualGraphHeight}px`}>
				<Graph
					title="Daily Evaporation"
					units="mm/day"
					yAxisMax={60}
					fillColor="#3498db"
					currentValue={evaporationRate}
				/>
			</div>
			<div class="graph-item" style={`height: ${individualGraphHeight}px`}>
				<Graph
					title="Maximum Engine Power"
					units="W/m²"
					yAxisMax={300}
					fillColor="#2ecc71"
					currentValue={maxEnginePower}
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
		grid-template-columns: 300px minmax(0, 1fr);
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
