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
	import evapotranspirationImage from "$lib/assets/evapotranspiration.jpg";
	import engineImage from "$lib/assets/engine.jpg";

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
			delta,
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

	// Page scaling for desktop, flexible layout for mobile
	let mainContainer: HTMLElement;

	function calculatePageScale() {
		if (!mainContainer) return;

		// Apply scaling for desktop (>800px)
		const baseWidth = 1400;
		const baseHeight = 900;
		const scaleX = window.innerWidth / baseWidth;
		const scaleY = window.innerHeight / baseHeight;
		const scale = Math.min(scaleX, scaleY, 1); // Never scale up beyond 100%

		mainContainer.style.transform = `scale(${scale})`;
		mainContainer.style.transformOrigin = "top left";
	}

	$effect(() => {
		if (!mainContainer) return;

		const onResize = () => {
			// Small delay to ensure DOM has updated
			requestAnimationFrame(() => calculatePageScale());
		};

		// Initial calculation
		calculatePageScale();

		// Listen to window resize
		window.addEventListener("resize", onResize);

		return () => {
			window.removeEventListener("resize", onResize);
		};
	});
</script>

<svelte:head>
	<title>Evaporation-Powered Engine Power Analysis</title>
	<meta name="description" content="A SvelteKit app with D3 visualization" />
</svelte:head>

<h1>Evaporation-Powered Engine Power Analysis</h1>

<section class="layout" bind:this={mainContainer}>
	<div class="sidebar">
		<RangeWithAxis
			label="Radiation"
			units="W/m²"
			min={0}
			max={1000}
			step={5}
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
		<div class="content-rows">
			<div class="row top-row">
				<figure class="row-image">
					<img
						src={evapotranspirationImage}
						alt="Evapotranspiration Cycle"
					/>
				</figure>
				<div class="graph-item">
					<Graph
						title="Daily Evaporation"
						units="mm/day"
						yAxisMax={60}
						fillColor="#3498db"
						currentValue={evaporationRate}
					/>
				</div>
				<div class="graph-item">
					<Graph
						title="Total Latent Energy"
						units="W/m²"
						yAxisMax={1750}
						fillColor="#e74c3c"
						currentValue={totalLatentEnergy}
					/>
				</div>
			</div>
			<div class="row bottom-row">
				<div class="row-image">
					<img
						src={engineImage}
						alt="Evaporation Energy Harvesting System"
					/>
				</div>
				<div class="graph-item">
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
	</div>
</section>

<style>
	h1 {
		text-align: center;
		color: var(--text-primary);
		margin-bottom: 16px;
		font-size: 2rem;
		font-weight: 400;
	}

	.layout {
		display: grid;
		grid-template-columns: 300px 1080px; /* Fixed width for desktop scaling */
		gap: 12px;
		align-items: start;
		width: 1400px; /* Fixed total width */
		height: 900px; /* Fixed total height */
		box-sizing: border-box;
	}

	.sidebar {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
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

	.content-rows {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 20px;
		padding: 16px 0;
	}

	.row {
		display: flex;
		justify-content: center;
		align-items: stretch;
		height: 360px; /* Fixed height for desktop scaling */
		gap: 16px;
	}

	.row-image {
		margin: 0;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		display: inline-block;
		height: 100%;
	}

	.row-image img {
		object-fit: contain;
		height: 100%;
		width: auto;
	}

	.graph-item {
		aspect-ratio: 3 / 5;
		min-width: 0;
		height: 100%;
	}

	/* Remove space after the last slider */
	:global(.sidebar > .control:last-child) {
		margin-bottom: 0;
	}
</style>
