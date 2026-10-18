<script lang="ts">
	import { onMount } from 'svelte';
	import { extent, scaleTime } from 'd3';

	type TimelineItem = { date: Date; label: string; description: string };
	// Examples only: replace these placeholders with verified Lake Street arts history.
	const timelineData: TimelineItem[] = [
		{
			date: new Date(1990, 0, 1),
			label: 'Sample milestone · 1990',
			description: 'Placeholder entry. Replace this with a verified Lake Street arts milestone.'
		},
		{
			date: new Date(2026, 9, 16),
			label: 'Sample milestone · Today',
			description:
				'Placeholder entry for today. Replace this with a current, verified Lake Street arts milestone.'
		}
	];
	const margin = { left: 54, right: 54 };
	let currentStep = $state(0);
	let width = $state(640);
	let height = $state(420);
	let narrativeElement: HTMLDivElement;
	let xScale = $derived(
		scaleTime()
			.domain(extent(timelineData, (item) => item.date) as [Date, Date])
			.range([margin.left, Math.max(margin.left + 1, width - margin.right)])
	);
	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting)
						currentStep = Number((entry.target as HTMLElement).dataset.step);
				}
			},
			{ rootMargin: '-40% 0px -40% 0px', threshold: 0 }
		);
		narrativeElement
			.querySelectorAll<HTMLElement>('[data-step]')
			.forEach((step) => observer.observe(step));
		return () => observer.disconnect();
	});
</script>

<section class="timeline-section" aria-labelledby="timeline-title">
	<header class="timeline-heading">
		<h1 id="timeline-title">Lake Street arts<br /><i> historically.</i></h1>
		<p class="intro">
			A timeline for the people, places, and creative work shaping the corridor. The entries below
			are placeholders until the history is researched.
		</p>
	</header>
	<div class="timeline-layout">
		<div class="graphic-pane" bind:clientWidth={width} bind:clientHeight={height}>
			<svg {width} {height} role="img" aria-label="Timeline from 1990 to today">
				<line
					x1={margin.left}
					y1={height / 2}
					x2={width - margin.right}
					y2={height / 2}
					class="base-line"
				/>
				{#each timelineData as item, i}
					<line
						x1={xScale(item.date)}
						y1={height / 2 - 14}
						x2={xScale(item.date)}
						y2={height / 2 + 14}
						class="tick"
					/>
					<circle
						cx={xScale(item.date)}
						cy={height / 2}
						r={currentStep === i ? 12 : 7}
						class:active={currentStep === i}
						class:visited={currentStep > i}
					/>
					<text x={xScale(item.date)} y={height / 2 + 42} text-anchor="middle" class="year"
						>{item.date.getFullYear()}</text
					>
				{/each}
			</svg>
			<div class="graphic-caption">1990 <span>—</span> Today</div>
		</div>
		<div class="narrative-pane" bind:this={narrativeElement}>
			{#each timelineData as item, i}
				<article
					class="step"
					class:active={currentStep === i}
					data-step={i}
					aria-current={currentStep === i ? 'step' : undefined}
				>
					<p class="eyebrow">{item.date.getFullYear()}</p>
					<h2>{item.label}</h2>
					<p>{item.description}</p>
					<time datetime={item.date.toISOString().slice(0, 10)}
						>{item.date.toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}</time
					>
				</article>
			{/each}
		</div>
	</div>
</section>

<style>
	.timeline-section {
		background: #e8e1d4;
		color: #252922;
	}
	.timeline-heading {
		padding: 100px max(8vw, 24px) 65px;
		border-top: 1px solid #d3cbbb;
	}
	.eyebrow {
		font-size: 9px;
		letter-spacing: 0.17em;
		font-weight: bold;
		color: #a44735;
		margin: 0 0 18px;
	}
	.timeline-heading h1 {
		font:
			400 clamp(48px, 7vw, 88px)/0.96 Georgia,
			serif;
		letter-spacing: -0.055em;
		margin: 0;
	}
	.timeline-heading h1 i {
		font-weight: 400;
		color: #a44735;
	}
	.intro {
		max-width: 450px;
		font:
			16px/1.7 Georgia,
			serif;
		color: #65645a;
		margin: 24px 0 0;
	}
	.timeline-layout {
		display: grid;
		grid-template-columns: 60% 40%;
		align-items: stretch;
		position: relative;
	}
	.graphic-pane {
		height: 70vh;
		min-height: 360px;
		position: sticky;
		top: 15vh;
		align-self: start;
		background: #f4f0e8;
		margin: 0 0 15vh 5vw;
		box-shadow: 0 5px 24px #29271e14;
	}
	.graphic-pane svg {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	.base-line {
		stroke: #c7c0b3;
		stroke-width: 2;
	}
	.tick {
		stroke: #c7c0b3;
		stroke-width: 1;
	}
	.graphic-pane circle {
		fill: #bcb4a6;
		stroke: #f4f0e8;
		stroke-width: 3;
		transition:
			r 0.35s,
			fill 0.35s;
	}
	.graphic-pane circle.active {
		fill: #a44735;
	}
	.graphic-pane circle.visited {
		fill: #597968;
	}
	.year {
		fill: #55564e;
		font:
			600 12px Arial,
			sans-serif;
	}
	.graphic-caption {
		position: absolute;
		left: 22px;
		bottom: 18px;
		font-size: 9px;
		letter-spacing: 0.16em;
		color: #78766c;
	}
	.graphic-caption span {
		color: #a44735;
		padding: 0 6px;
	}
	.narrative-pane {
		padding-right: 10vw;
	}
	.step {
		min-height: 78vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 60px 8vw 60px 7vw;
		border-bottom: 1px solid #d4ccbd;
		opacity: 0.52;
		transition: opacity 0.35s;
	}
	.step.active {
		opacity: 1;
	}
	.step h2 {
		font:
			400 clamp(34px, 4vw, 56px)/1.05 Georgia,
			serif;
		letter-spacing: -0.04em;
		margin: 0 0 18px;
	}
	.step > p:not(.eyebrow) {
		max-width: 440px;
		font:
			17px/1.75 Georgia,
			serif;
		color: #65645a;
		margin: 0;
	}
	.step time {
		font-size: 11px;
		color: #a44735;
		margin-top: 24px;
	}
	@media (max-width: 760px) {
		.timeline-heading {
			padding: 72px 8vw 45px;
		}
		.timeline-layout {
			display: flex;
			flex-direction: column;
		}
		.graphic-pane {
			z-index: 2;
			top: 0;
			margin: 0;
			width: 100%;
			height: 32vh;
			min-height: 220px;
			box-shadow: 0 4px 14px #29271e14;
		}
		.narrative-pane {
			padding: 0 8vw;
		}
		.step {
			min-height: 65vh;
			padding: 55px 2vw;
			opacity: 1;
		}
		.step h2 {
			font-size: 38px;
		}
		.graphic-caption {
			bottom: 10px;
			left: 14px;
		}
	}
</style>
