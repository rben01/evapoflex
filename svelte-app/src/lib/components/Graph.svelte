<script lang="ts">
	import * as d3 from "d3";
	import { onMount } from "svelte";

	type D3Selection<Elem extends d3.BaseType> = d3.Selection<
		Elem,
		unknown,
		null,
		undefined
	>;

	let container: HTMLDivElement;
	let width = $state(800);
	let height = $state(500);

	type Props = {
		title: string;
		units: string;
		yAxisMax: number;
		fillColor: string;
		currentValue: number;
	};
	const { title, units, yAxisMax, fillColor, currentValue }: Props = $props();

	// Function to detect current page scale for font sizing
	function getCurrentScale() {
		const layoutElement = document?.querySelector(".layout");
		if (layoutElement) {
			const transform = (layoutElement as HTMLElement).style.transform;
			if (transform && transform.includes("scale")) {
				const match = transform.match(/scale\(([^)]+)\)/);
				return match ? parseFloat(match[1]) : 1;
			}
		}
		return 1;
	}

	// Cache D3 selections for efficient updates
	let svg: D3Selection<SVGSVGElement>;
	let g: D3Selection<SVGGElement>;
	let valueBar: D3Selection<SVGRectElement>;
	let valueLabel: D3Selection<SVGTextElement>;
	let yAxis: D3Selection<SVGGElement>;

	// Derived layout values
	let margin = { top: 4, right: 12, bottom: 20, left: 35 };

	const innerWidth = $derived(width - margin.left - margin.right);
	const innerHeight = $derived(height - margin.top - margin.bottom);
	const x = $derived(d3.scaleLinear().domain([0, 1]).range([0, innerWidth]));
	const xAxis = $derived(
		d3
			.axisBottom(x)
			.ticks(0)
			.tickSizeOuter(0)
			.tickFormat(() => ""),
	);
	const barWidth = $derived(Math.min(120, innerWidth * 0.25));
	const xBar = $derived(Math.max(10, (innerWidth - barWidth) / 2));
	const yMax = $derived(Math.max(0, yAxisMax || 1));
	const y = $derived(
		d3.scaleLinear().domain([0, yMax]).range([innerHeight, 0]),
	);
	const clamped = $derived(Math.max(0, Math.min(currentValue ?? 0, yMax)));

	// Function to update font sizes based on current scale
	const updateFontSizes = () => {
		const scale = getCurrentScale();
		const baseLabelSize = 12;
		const baseAxisSize = 11;

		const scaledLabelSize = baseLabelSize * scale;
		const scaledAxisSize = baseAxisSize * scale;

		// Update value label font size
		if (valueLabel) {
			valueLabel.style("font-size", `${scaledLabelSize}px`);
		}

		// Update CSS custom property for axis text
		document.documentElement.style.setProperty(
			"--axis-font-size",
			`${scaledAxisSize}px`,
		);
	};

	// ResizeObserver to keep SVG sized to its container at all times
	$effect(() => {
		if (!container) return;

		const updateSVGSize = () => {
			const rect = container.getBoundingClientRect();

			// Container size is what we use - padding and border handled by CSS
			const newWidth = rect.width;
			const newHeight = rect.height;

			// Calculate proportional margins based on container size and scale
			const scale = getCurrentScale();
			const baseMarginPercent = {
				top: 1,
				right: 0.015,
				bottom: 0.04,
				left: 0.3,
			};

			// Apply scale factor and calculate pixel values
			margin = {
				top: Math.max(
					2,
					Math.min(newHeight * baseMarginPercent.top * scale, 8),
				),
				right: Math.max(
					6,
					Math.min(newWidth * baseMarginPercent.right * scale, 20),
				),
				bottom: Math.max(
					12,
					Math.min(newHeight * baseMarginPercent.bottom * scale, 40),
				),
				left: Math.max(
					30,
					Math.min(newWidth * baseMarginPercent.left * scale, 40),
				),
			};

			// Only update if there's a meaningful change

			width = newWidth;
			height = newHeight;
		};

		// Initial sizing
		updateSVGSize();

		// Watch container for size changes
		const resizeObserver = new ResizeObserver(() => {
			requestAnimationFrame(() => {
				updateSVGSize();
				updateFontSizes();
			});
		});

		resizeObserver.observe(container);

		return () => {
			resizeObserver.disconnect();
		};
	});

	// One-time SVG setup
	onMount(() => {
		if (!container) return;

		// Remove any existing SVG
		d3.select(container).select("svg").remove();

		// Create SVG structure
		svg = d3
			.select(container)
			.append("svg")
			.attr("width", "100%")
			.attr("height", "100%")
			.style("display", "block");

		g = svg
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);

		// Create static axes containers

		g.append("g")
			.attr("class", "x-axis")
			.attr("transform", `translate(0,${innerHeight})`)
			.call(xAxis);

		yAxis = g.append("g").attr("class", "y-axis");

		// Create dynamic elements
		valueBar = g
			.append("rect")
			.attr("class", "value-bar")
			.attr("opacity", 0.9);

		valueLabel = g
			.append("text")
			.attr("class", "value-label")
			.attr("text-anchor", "middle")
			.attr("fill", "var(--text-primary)");

		return () => {
			if (svg) svg.remove();
		};
	});

	// Layout updates (when size or scale changes)
	$effect(() => {
		if (!svg || !g) return;

		// Update SVG viewBox
		svg.attr("viewBox", `0 0 ${width} ${height}`);

		// Update group transform
		g.attr("transform", `translate(${margin.left},${margin.top})`);

		// Update x-axis
		(g.select(".x-axis") as D3Selection<SVGGElement>)
			.attr("transform", `translate(0,${innerHeight})`)
			.call(xAxis);

		// Update y-axis
		const tickCount = 5;
		const step = yMax / tickCount;
		const yTicks = [];
		for (let i = 0; i <= tickCount; i++) {
			yTicks.push(Math.round(i * step * 10) / 10);
		}
		const yAxisGenerator = d3.axisLeft(y).tickValues(yTicks).tickSizeOuter(0);
		yAxis.call(yAxisGenerator);

		// Update font sizes based on current scale
		updateFontSizes();
	});

	// Data updates (when value or color changes)
	$effect(() => {
		if (!valueBar || !valueLabel) return;

		// Update bar
		valueBar
			.attr("x", xBar)
			.attr("y", y(clamped))
			.attr("width", barWidth)
			.attr("height", innerHeight - y(clamped))
			.attr("fill", fillColor || "steelblue");

		// Update label
		valueLabel
			.attr("x", xBar + barWidth / 2)
			.attr("y", y(clamped) - 8)
			.text(`${clamped.toFixed(2)} ${units}`);
	});
</script>

<div class="graph-container">
	<h3 class="graph-title">{title}</h3>
	<h4 class="graph-subtitle">({units})</h4>
	<div bind:this={container} class="chart"></div>
</div>

<style>
	.graph-container {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		box-sizing: border-box;
		border: 1px solid var(--border-primary);
		padding: 8px;
	}

	.graph-title {
		margin: 0 0 2px 0;
		padding: 0;
		font-size: 14px;
		font-weight: 600;
		color: var(--text-primary);
		text-align: center;
		flex-shrink: 0;
	}

	.graph-subtitle {
		margin: 0 0 0 0;
		font-size: 12px;
	}

	.chart {
		display: block;
		width: 100%;
		flex: 1;
		align-self: flex-end;
		box-sizing: border-box;
		padding: 0;
	}

	/* basic axis styling */
	:global(.x-axis path),
	:global(.y-axis path) {
		stroke: var(--text-secondary);
	}
	:global(.x-axis line),
	:global(.y-axis line) {
		stroke: var(--text-secondary);
	}
	:global(.x-axis text),
	:global(.y-axis text) {
		fill: var(--text-secondary);
		font-size: var(--axis-font-size, 11px);
	}
	:global(.y-title) {
		dominant-baseline: middle;
	}
</style>
