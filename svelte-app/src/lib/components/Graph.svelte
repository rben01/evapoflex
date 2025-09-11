<script lang="ts">
	import * as d3 from "d3";

	let container: HTMLDivElement;
	let width = 800;
	let height = 500;

	type Props = {
		title: string;
		units: string;
		yAxisMax: number;
		fillColor: string;
		currentValue: number;
	};
	const { title, units, yAxisMax, fillColor, currentValue }: Props = $props();

	$effect(() => {
		const margin = { top: 16, right: 24, bottom: 40, left: 56 };
		const innerWidth = width - margin.left - margin.right;
		const innerHeight = height - margin.top - margin.bottom;

		d3.select(container).select("svg").remove();

		const svg = d3
			.select(container)
			.append("svg")
			.attr("width", width)
			.attr("height", height)
			.style("border", "1px solid #eee");

		const g = svg
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);

		const yMax = Math.max(0, yAxisMax || 1);
		const y = d3
			.scaleLinear()
			.domain([0, yMax])
			.nice()
			.range([innerHeight, 0]);
		const yAxis = d3.axisLeft(y).ticks(6).tickSizeOuter(0);

		g.append("g").attr("class", "y-axis").call(yAxis);

		// Axis label (units)
		g.append("text")
			.attr("class", "y-label")
			.attr("x", 0)
			.attr("y", -8)
			.attr("fill", "#333")
			.attr("text-anchor", "start")
			.style("font-size", "12px")
			.text(units);

		// Title inside svg
		svg.append("text")
			.attr("x", margin.left)
			.attr("y", 12)
			.attr("fill", "#2c3e50")
			.style("font-size", "14px")
			.style("font-weight", 600)
			.text(title);

		// Single vertical bar representing current value
		const barWidth = Math.min(120, innerWidth * 0.25);
		const xBar = Math.max(10, (innerWidth - barWidth) / 2);
		const clamped = Math.max(0, Math.min(currentValue ?? 0, yMax));
		g.append("rect")
			.attr("class", "value-bar")
			.attr("x", xBar)
			.attr("y", y(clamped))
			.attr("width", barWidth)
			.attr("height", innerHeight - y(clamped))
			.attr("fill", fillColor || "steelblue")
			.attr("opacity", 0.9);

		// Numeric label of current value
		g.append("text")
			.attr("class", "value-label")
			.attr("x", xBar + barWidth / 2)
			.attr("y", y(clamped) - 8)
			.attr("text-anchor", "middle")
			.attr("fill", "#333")
			.style("font-size", "12px")
			.text(`${clamped} ${units}`);

		return () => svg.remove();
	});
</script>

<div class="graph-container">
	<div bind:this={container} class="chart"></div>
</div>

<style>
	.graph-container {
		/* match sidebar top padding for aligned tops */
		padding: 16px 0 0 0;
	}

	.chart {
		display: inline-block;
		margin: 0 0 20px 0;
		max-width: 100%;
	}
</style>
