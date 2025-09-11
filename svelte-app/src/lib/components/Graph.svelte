<script lang="ts">
  import * as d3 from "d3";

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

  // Simple one-time sizing when container is available
  $effect(() => {
    if (!container) return;
    
    // Get the container size once and use it
    const rect = container.getBoundingClientRect();
    const containerWidth = rect.width || 800;
    const containerHeight = rect.height || 300;
    
    width = Math.max(260, Math.floor(containerWidth));
    height = Math.max(200, Math.floor(containerHeight));
  });

  $effect(() => {
    const margin = { top: 16, right: 24, bottom: 40, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    d3.select(container).select("svg").remove();

    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("border", "1px solid #eee")
      .style("display", "block");

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const yMax = Math.max(0, yAxisMax || 1);
    const y = d3.scaleLinear().domain([0, yMax]).range([innerHeight, 0]);
    // Build ticks from 0 to yMax inclusive
    const desiredTicks = 6;
    const step = Math.max(1, Math.round(d3.tickStep(0, yMax, desiredTicks)));
    let yTicks = d3.range(0, yMax + step, step);
    if (yTicks[yTicks.length - 1] !== yMax) yTicks = [...yTicks, yMax];
    const yAxis = d3.axisLeft(y).tickValues(yTicks).tickSizeOuter(0);

    // Bottom X axis as a baseline for reference
    const x = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);
    const xAxis = d3.axisBottom(x).ticks(5).tickFormat(() => "");
    g
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis);

    // Left Y axis with ticks from 0..yAxisMax
    g.append("g").attr("class", "y-axis").call(yAxis);

    // Y-axis title, centered and rotated 90 degrees
    g
      .append("text")
      .attr("class", "y-title")
      .attr(
        "transform",
        `translate(${-margin.left + 18}, ${innerHeight / 2}) rotate(-90)`
      )
      .attr("text-anchor", "middle")
      .attr("fill", "#2c3e50")
      .style("font-size", "13px")
      .style("font-weight", 600)
      .text(`${title} (${units})`);

    // Single vertical bar representing current value
    const barWidth = Math.min(120, innerWidth * 0.25);
    const xBar = Math.max(10, (innerWidth - barWidth) / 2);
    const clamped = Math.max(0, Math.min(currentValue ?? 0, yMax));
    g
      .append("rect")
      .attr("class", "value-bar")
      .attr("x", xBar)
      .attr("y", y(clamped))
      .attr("width", barWidth)
      .attr("height", innerHeight - y(clamped))
      .attr("fill", fillColor || "steelblue")
      .attr("opacity", 0.9);

    // Numeric label of current value
    g
      .append("text")
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
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .chart {
    display: block;
    width: 100%;
    flex: 1;
    box-sizing: border-box;
  }

  /* basic axis styling */
  :global(.x-axis path),
  :global(.y-axis path) {
    stroke: #888;
  }
  :global(.x-axis line),
  :global(.y-axis line) {
    stroke: #ccc;
  }
  :global(.x-axis text),
  :global(.y-axis text) {
    fill: #444;
    font-size: 11px;
  }
  :global(.y-title) { dominant-baseline: middle; }
</style>
