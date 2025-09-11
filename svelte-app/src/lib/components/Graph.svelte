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

  // Set SVG dimensions to exactly match container - no overflow allowed
  $effect(() => {
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    width = Math.floor(rect.width || 800);
    height = Math.floor(rect.height || 200);
  });

  $effect(() => {
    const margin = { top: 4, right: 12, bottom: 20, left: 50 };
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
    
    // Simple, clean tick generation
    const tickCount = 5;
    const step = yMax / tickCount;
    const yTicks = [];
    for (let i = 0; i <= tickCount; i++) {
      yTicks.push(Math.round(i * step * 10) / 10); // Round to 1 decimal
    }
    
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
    height: 100%;
    box-sizing: border-box;
    overflow: hidden; /* Prevent any SVG overflow */
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
