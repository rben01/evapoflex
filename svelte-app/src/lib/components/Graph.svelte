<script lang="ts">
	import * as d3 from "d3";

	let container: HTMLDivElement;
	let width = 800;
	let height = 600;

	type Props = {
		latitude: number;
		airTemperature: number;
		windSpeed: number;
		relativeHumidity: number;
	};
	const { latitude, airTemperature, windSpeed, relativeHumidity }: Props =
		$props();

	// Svelte 5: use a rune-based effect instead of onMount
	$effect(() => {
		// Ensure a clean slate if HMR or re-runs occur
		d3.select(container).select("svg").remove();

		// D3 setup - create SVG container
		const svg = d3
			.select(container)
			.append("svg")
			.attr("width", width)
			.attr("height", height)
			.style("border", "1px solid #ccc");

		// Placeholder content - simple circle to demonstrate D3 is working
		svg.append("circle")
			.attr("cx", width / 2)
			.attr("cy", height / 2)
			.attr("r", 50)
			.attr("fill", "steelblue")
			.attr("opacity", 0.7);

		// Placeholder text
		svg.append("text")
			.attr("x", width / 2)
			.attr("y", height / 2 + 80)
			.attr("text-anchor", "middle")
			.attr("font-family", "Arial, sans-serif")
			.attr("font-size", "18px")
			.attr("fill", "#333")
			.text("D3 Graph Placeholder");

		// Add axes placeholders
		const xScale = d3
			.scaleLinear()
			.domain([0, 100])
			.range([50, width - 50]);

		const yScale = d3
			.scaleLinear()
			.domain([0, 100])
			.range([height - 50, 50]);

		const xAxis = d3.axisBottom(xScale);
		const yAxis = d3.axisLeft(yScale);

		svg.append("g")
			.attr("transform", `translate(0, ${height - 50})`)
			.call(xAxis);

		svg.append("g").attr("transform", "translate(50, 0)").call(yAxis);

		// Cleanup when the component unmounts
		return () => {
			svg.remove();
		};
	});
</script>

<div class="graph-container">
	<div bind:this={container} class="chart"></div>
</div>

<style>
	.graph-container {
		/* match sidebar top padding for aligned tops */
		padding: 16px 0 0 0;
		text-align: center;
	}

	.chart {
		display: inline-block;
		margin: 0 0 20px 0;
	}
</style>
