<script lang="ts">
	interface Props {
		label: string;
		min: number;
		max: number;
		step?: number;
		value: number;
		format?: (n: number) => string;
	}

	let {
		label,
		min,
		max,
		step = 1,
		value = $bindable(),
		format = (n) => `${Math.round(n)}`,
	}: Props = $props();

	const id = `${label.replace(/\s+/g, "-").toLowerCase()}-slider`;

	const tickCount = 6;
	const ticks = $derived.by(() => {
		const range = max - min;
    const count = Math.max(2, tickCount);
		const stepVal = range / (count - 1);
		return Array.from({ length: count }, (_, i) => min + i * stepVal);
	});
</script>

<div class="control">
	<label class="label" for={id}>
		{label}: <span class="value">{format(value)}</span>
	</label>
	<input {id} type="range" {min} {max} {step} bind:value />
	<div class="axis">
		{#each ticks as t}
			{#key t}
				<div
					class="tick"
					style={`left: ${(100 * (t - min)) / (max - min)}%`}
				>
					<span class="tick-mark"></span>
					<span class="tick-label">{format(t)}</span>
				</div>
			{/key}
		{/each}
	</div>
</div>

<style>
	.control {
		margin-bottom: 24px;
		max-width: 100%;
	}
	.label {
		display: block;
		font-weight: 600;
		margin-bottom: 6px;
	}
	.value {
		font-variant-numeric: tabular-nums;
		margin-left: 6px;
		font-weight: 500;
	}

	input[type="range"] {
		width: 100%;
		max-width: 100%;
	}

	.axis {
		position: relative;
		height: 28px;
		margin-top: 6px;
		overflow: hidden; /* prevent tick labels from causing horizontal scroll */
	}

	.tick {
		position: absolute;
		transform: translateX(-50%);
		text-align: center;
		color: #333;
		font-size: 0.85rem;
		white-space: nowrap;
	}

	/* keep edge labels inside the container */
	.tick:first-child {
		transform: translateX(0%);
	}
	.tick:last-child {
		transform: translateX(-100%);
	}

	.tick-mark {
		display: block;
		width: 1px;
		height: 6px;
		background: #666;
		margin: 0 auto 4px auto;
	}

	.tick-label {
		display: block;
		transform: translateY(0);
	}
</style>
