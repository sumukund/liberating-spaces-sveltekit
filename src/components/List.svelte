<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import lakeStreetRaw from '#lib/assets/Lake Street Art Map.geojson?raw';
	import { activeChapter, activePlaces, focusPlace, selectedPlace } from './stores.js';
	import { firebasePlaces, watchPlaces } from '../lib/firebase.js';

	type Place = {
		type: 'Feature';
		geometry: { type: 'Point'; coordinates: [number, number] };
		properties: {
			Name: string;
			Type: string;
			Still_there_: string;
			Address: string;
			description: string;
			_index?: number;
			_id?: string;
		};
	};
	const source = JSON.parse(lakeStreetRaw) as {
		features: Place[];
	};
	let places = $state<Place[]>(source.features);
	// Customize chapter copy and category matching here. The active chapter controls Map.svelte.
	const chapters = [
		{
			id: 'all',
			kicker: 'THE COLLECTION',
			title: 'Art lives along Lake Street.',
			text: 'A living map of the artists, gathering places, and cultural spaces shaping this corridor.',
			filter: (_p: Place) => true
		},
		{
			id: 'events',
			kicker: 'Gatherings and Events',
			title: 'Events bring people together.',
			text: 'Performances, assemblies, and shared moments that made the street a place to gather.',
			filter: (p: Place) => /event|performance/i.test(p.properties.Type)
		},
		{
			id: 'installations',
			kicker: 'Public art and Installations',
			title: 'Art changes how we see a place.',
			text: 'Installations and public facing creative work, mapped where it meets the neighborhood.',
			filter: (p: Place) =>
				/installation|sculpture|exhibition|public art|mural/i.test(p.properties.Type)
		},
		{
			id: 'places',
			kicker: 'Cultural and Community Spaces',
			title: 'Spaces make culture possible.',
			text: 'Organizations, venues, and independent places sustaining art and community along the corridor.',
			filter: (p: Place) =>
				!/event|performance|installation|sculpture|exhibition|mural/i.test(p.properties.Type)
		},
				{
			id: 'murals',
			kicker: 'Murals',
			title: 'Street art and visible culture on Lake Street',
			text: 'Murals that brighten the neighborhood and showcase the diversity of culture in Minnesota.',
			filter: (p: Place) =>
				/mural/i.test(p.properties.Type)
		},
		{
			id: 'past',
			kicker: 'Memories',
			title: 'Lake Street ',
			text: 'Past locations are part of the street’s history and show us how the art community has changed over time.',
			filter: (p: Place) => /past/i.test(p.properties.Still_there_)
		}
	];
	let listElement: HTMLElement;
	let search = $state('');
	let typeFilter = $state('All types');
	let statusFilter = $state('All statuses');
	let types = $derived(['All types', ...new Set(places.map((p) => p.properties.Type).filter(Boolean))]);
	let statuses = $derived([
		'All statuses',
		...new Set(places.map((p) => p.properties.Still_there_).filter(Boolean))
	]);
	let visiblePlaces = $derived(
		places.filter((p) => {
			const q = search.toLowerCase();
			return (
				chapters[$activeChapter].filter(p) &&
				(!q || `${p.properties.Name} ${p.properties.Address}`.toLowerCase().includes(q)) &&
				(typeFilter === 'All types' || p.properties.Type === typeFilter) &&
				(statusFilter === 'All statuses' || p.properties.Still_there_ === statusFilter)
			);
		})
	);
	$effect(() => {
		const next = visiblePlaces;
		const previous = get(activePlaces) as Place[];
		if (next.length !== previous.length || next.some((place, index) => place !== previous[index]))
			activePlaces.set(next);
	});
	function choose(place: Place) {
		selectedPlace.set(place);
		focusPlace.set(place);
	}
	onMount(() => {
		let cloudRecords: any[] = [];
		let disposed = false;
		const syncPlaces = () => {
			const cloud = cloudRecords.map((record) => ({
				type: 'Feature' as const,
				geometry: { type: 'Point' as const, coordinates: record.coordinates ?? [-93.25, 44.948] as [number, number] },
				properties: { Name: record.Name, Type: record.Type, Still_there_: record.Still_there_, Address: record.Address, description: record.description, _id: record.id }
			}));
			places = [...places.filter((place) => !place.properties._id), ...cloud];
		};
		const stopWatching = watchPlaces((error) => console.error('Unable to load Firebase map results:', error));
		const stopStore = firebasePlaces.subscribe((items) => { cloudRecords = items as any[]; syncPlaces(); });
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries)
					if (entry.isIntersecting)
						activeChapter.set(Number((entry.target as HTMLElement).dataset.chapter));
			},
			{ rootMargin: '-40% 0px -40% 0px' }
		);
		listElement
			.querySelectorAll<HTMLElement>('[data-chapter]')
			.forEach((el) => observer.observe(el));
		return () => { disposed = true; observer.disconnect(); stopWatching(); stopStore(); };
	});
</script>

<div class="list-column" bind:this={listElement}>
	<header class="topbar">
		<a class="brand" href="#top"
			><span
				><strong>Liberating Spaces</strong><small>Lake Street Art Map</small></span
			></a
		><a class="about-link" href="#collection">Explore the map</a>
	</header>
	<section class="intro" id="top">
		<h1>Art <br />on <i>Lake Street</i></h1>
		<p class="intro-copy">
			A map of the art, gathering places, and cultural spaces that make up the Lake Street corridor.
		</p>
		<a class="scroll-cue" href="#collection">scroll to explore</a>
	</section>
	<section class="chapters" id="collection" aria-label="Lake Street story chapters">
		{#each chapters as chapter, i (chapter.id)}<article
				class="chapter"
				data-chapter={i}
				class:active={$activeChapter === i}
			>
				<p class="eyebrow">{chapter.kicker}</p>
				<h2>{chapter.title}</h2>
				<p class="chapter-copy">{chapter.text}</p>
				<span class="chapter-count">{places.filter(chapter.filter).length} locations</span>
			</article>{/each}
	</section>
	<section class="directory">
		<div class="directory-head">
			<div><h2>Search</h2></div>
			<span>{places.length} places</span>
		</div>
		<div class="filters">
			<label><span>Search</span><input bind:value={search} placeholder="Name or address" /></label
			><label
				><span>Type</span><select bind:value={typeFilter}
					>{#each types as type}<option>{type}</option>{/each}</select
				></label
			><label
				><span>Status</span><select bind:value={statusFilter}
					>{#each statuses as status}<option>{status}</option>{/each}</select
				></label
			>
		</div>
		<div class="place-grid">
			{#each visiblePlaces as place, i (`${place.properties.Name}-${i}`)}<button
					class="place-card"
					onclick={() => choose(place)}
					><span class="place-dot"></span><span
						><strong>{place.properties.Name}</strong><small>{place.properties.Address}</small><em
							>{place.properties.Type} · {place.properties.Still_there_}</em
						></span
					><span class="arrow">↗</span></button
				>{:else}<p>No places match those filters.</p>{/each}
		</div>
	</section>
</div>

<style>
	.list-column {
		min-width: 0;
		background: var(--color-lavender-veil);
	}
	.topbar {
		height: 82px;
		padding: 0 28px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--color-thistle);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 12px;
		color: inherit;
		text-decoration: none;
	}
	.brand strong,
	.brand small {
		display: block;
	}
	.brand strong {
		font:
			600 15px Courier,
			monospace;
	}
	.brand small {
		font-size: 10px;
		color: #79796e;
		margin-top: 4px;
	}
	.about-link {
		color: inherit;
		text-decoration: none;
		font-size: 12px;
	}
	.intro {
		min-height: 570px;
		padding: 100px 11% 75px;
		position: relative;
		background: var(--color-vintage-lavender);
	}
	.eyebrow {
		font-size: 9px;
		letter-spacing: 0.17em;
		font-weight: bold;
		color: var(--color-deep-space-blue);
		margin: 0 0 20px;
	}
	.intro h1 {
		font:
			400 clamp(50px, 6.2vw, 88px)/0.95 Georgia,
			serif;
		letter-spacing: -0.055em;
		margin: 0;
	}
	.intro h1 i {
		color: var(--color-deep-space-blue);
		font-weight: 400;
	}
	.intro-copy {
		font:
			16px/1.65 Georgia,
			serif;
		max-width: 360px;
		color: #5a594f;
		margin: 28px 0;
	}
	.scroll-cue {
		position: absolute;
		bottom: 34px;
		color: #626258;
		text-decoration: none;
		font-size: 9px;
		letter-spacing: 0.16em;
	}
	.chapter {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 75px 12%;
		opacity: 0.48;
		transition: opacity 0.3s;
	}
	.chapter.active {
		opacity: 1;
	}
	.chapter h2 {
		font:
			400 clamp(38px, 4.6vw, 64px)/1.04 Georgia,
			serif;
		letter-spacing: -0.04em;
		margin: 0 0 22px;
	}
	.chapter-copy {
		font:
			17px/1.7 Georgia,
			serif;
		color: #65645a;
		max-width: 410px;
		margin: 0;
	}
	.chapter-count {
		font-size: 9px;
		letter-spacing: 0.16em;
		color: var(--color-deep-space-blue);
		margin-top: 34px;
	}
	.directory {
		padding: 80px 8%;
		background: #f8f5ed;
	}
	.directory-head {
		display: flex;
		justify-content: space-between;
		align-items: end;
		border-bottom: 1px solid var(--color-thistle);
		padding-bottom: 20px;
	}

	.directory-head h2 {
		font:
			38px Georgia,
			serif;
		margin: 0;
	}
	.directory-head > span {
		font-size: 12px;
		color: var(--color-deep-space-blue);
	}
	.filters {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		padding: 20px 0;
	}
	.filters label {
		display: flex;
		flex-direction: column;
		gap: 7px;
		font-size: 10px;
		color: var(--color-deep-space-blue);
	}
	.filters label:first-child {
		grid-column: span 2;
	}
	.filters input,
	.filters select {
		font: 13px Arial;
		border: 1px solid var(--color-thistle);
		background: #fffdf8;
		padding: 11px;
		color: #333;
		min-width: 0;
	}
	.place-grid {
		border-top: 1px solid var(--color-thistle);
	}
	.place-card {
		width: 100%;
		display: flex;
		align-items: flex-start;
		gap: 10px;
		text-align: left;
		padding: 16px 5px;
		border: 0;
		border-bottom: 1px solid var(--color-thistle);
		background: transparent;
		cursor: pointer;
		color: inherit;
	}
	.place-card:hover {
		background: #eee9de;
	}
	.place-card > span:nth-child(2) {
		flex: 1;
	}
	.place-card strong,
	.place-card small,
	.place-card em {
		display: block;
	}
	.place-card strong {
		font:
			16px Georgia,
			serif;
	}
	.place-card small {
		font-size: 10px;
		color: var(--color-deep-space-blue);
		margin-top: 5px;
	}
	.place-card em {
		font-style: normal;
		font-size: 9px;
		color: var(--color-deep-space-blue);
		margin-top: 8px;
	}
	.place-dot {
		width: 8px;
		height: 8px;
		flex: none;
		border-radius: 50%;
		margin-top: 5px;
		background: var(--color-indigo-velvet);
	}
	.place-dot[data-status='Present'] {
		background: #16856b;
	}
	.place-dot[data-status='Future'] {
		background: #7450b8;
	}
	.arrow {
		color: var(--color-deep-space-blue);
	}
	@media (max-width: 760px) {
		.topbar {
			height: 68px;
			padding: 0 18px;
		}
		.intro {
			min-height: 450px;
			padding: 78px 9% 60px;
		}
		.chapter {
			min-height: 68vh;
			padding: 65px 10%;
			opacity: 1;
		}
	}
</style>
