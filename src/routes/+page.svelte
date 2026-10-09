<script lang="ts">
	import { onMount } from 'svelte';
	import { Map as MapLibreMap, NavigationControl, GeoJSONSource } from 'maplibre-gl';
	import lakeStMap from '#lib/assets/Lake Street Art Map.geojson?raw';
	import 'maplibre-gl/dist/maplibre-gl.css';
    import {setContext } from 'svelte';
	type Place = {
		type: 'Feature';
		geometry: { type: 'Point'; coordinates: [number, number] };
		properties: { Name: string; Type: string; Still_there_: string; Address: string; description: string; _index?: number };
	};
	type PlaceCollection = { features: Place[] };
	const lakeStreetData = JSON.parse(lakeStMap) as PlaceCollection;

	function locate(address: string, index: number): [number, number] {
		const number = Number(address.match(/^\d+/)?.[0] ?? 3000);
		const lower = address.toLowerCase();
		let lng = -93.25;
		let lat = 44.948;

		if (lower.includes('lake st')) {
			const west = /\bw\s+lake/.test(lower);
			const east = /\be\s+lake/.test(lower);
			lng = west ? -93.265 - number * 0.000006 : east ? -93.262 + number * 0.000006 : -93.262;
		} else if (lower.includes('minnehaha')) {
			lng = -93.234;
			lat = 44.948 + (number - 3000) * 0.000008;
		} else if (lower.includes('bloomington')) {
			lng = -93.252;
			lat = 44.948 + (number - 3000) * 0.000008;
		} else if (lower.includes('lyndale')) {
			lng = -93.288;
			lat = 44.948 + (number - 3000) * 0.000008;
		} else if (lower.includes('bryant')) {
			lng = -93.291;
			lat = 44.948 + (number - 3000) * 0.000008;
		} else if (lower.includes('chicago')) {
			lng = -93.262;
		} else if (lower.includes('15th ave')) {
			lng = -93.255;
			lat = 44.948 + (number - 3000) * 0.000008;
		} else if (lower.includes('16th ave')) {
			lng = -93.254;
			lat = 44.948 + (number - 3000) * 0.000008;
		} else if (lower.includes('27th ave')) {
			lng = -93.231;
			lat = 44.948 + (number - 3000) * 0.000008;
		} else if (lower.includes('29th st')) {
			lat = 44.942;
			lng = -93.262 + (number - 2900) * 0.000006;
		} else if (lower.includes('snelling')) {
			lng = -93.222;
		}

		// Keep multiple records at the same address independently clickable.
		const duplicates = lakeStreetData.features.filter((feature) => feature.properties.Address === address).length;
		const offset = duplicates > 1 ? ((index % duplicates) - (duplicates - 1) / 2) * 0.00012 : 0;
		return [lng + offset, lat + offset];
	}

	const places: Place[] = lakeStreetData.features.map((feature, index) => ({
		...feature,
		geometry: { type: 'Point', coordinates: locate(feature.properties.Address, index) }
	}));

	let mapElement: HTMLDivElement;
	let map: MapLibreMap;
	let selected: Place | null = $state(null);
	let search = $state('');
	let typeFilter = $state('All types');
	let statusFilter = $state('All statuses');
	let mapReady = $state(false);

	const types = ['All types', ...new Set(places.map((place) => place.properties.Type).filter(Boolean))];
	const statuses = ['All statuses', ...new Set(places.map((place) => place.properties.Still_there_).filter(Boolean))];
	const visiblePlaces = $derived(places.filter(({ properties }) =>
		(properties.Name.toLowerCase().includes(search.toLowerCase()) || properties.Address.toLowerCase().includes(search.toLowerCase())) &&
		(typeFilter === 'All types' || properties.Type === typeFilter) &&
		(statusFilter === 'All statuses' || properties.Still_there_ === statusFilter)
	));
    
	if (setContext(false, () => mapReady) && map?.getSource('art-places')) {
		(map.getSource('art-places') as GeoJSONSource).setData({
			type: 'FeatureCollection',
			features: visiblePlaces.map((place) => ({ ...place, properties: { ...place.properties, _index: places.indexOf(place) } }))
		});
	}

	function choose(place: Place) {
		selected = place;
		map?.flyTo({ center: place.geometry.coordinates, zoom: 15, duration: 700 });
	}

	onMount(() => {
		map = new MapLibreMap({
			container: mapElement,
			center: [-93.25, 44.948],
			zoom: 12.2,
			style: {
				version: 8,
				sources: {
					openstreetmap: {
						type: 'raster',
						tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
						tileSize: 256,
						attribution: '© OpenStreetMap contributors'
					}
				},
				layers: [{ id: 'osm', type: 'raster', source: 'openstreetmap' }]
			}
		});
		map.addControl(new NavigationControl(), 'top-right');
		map.on('load', () => {
			map.addSource('art-places', { type: 'geojson', data: { type: 'FeatureCollection', features: visiblePlaces.map((place) => ({ ...place, properties: { ...place.properties, _index: places.indexOf(place) } })) } });
			map.addLayer({
				id: 'art-place-points', type: 'circle', source: 'art-places',
				paint: {
					'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 15, 9],
					'circle-color': ['match', ['get', 'Still_there_'], 'Present', '#16856b', 'Future', '#7450b8', 'Gone', '#c05b48', '#d29a38'],
					'circle-stroke-color': '#fffaf2', 'circle-stroke-width': 2
				}
			});
			map.on('click', 'art-place-points', (event) => {
				const feature = event.features?.[0];
				if (feature?.properties) {
					const found = places[Number(feature.properties?._index)];
					if (found) selected = found;
				}
			});
			map.on('mouseenter', 'art-place-points', () => (map.getCanvas().style.cursor = 'pointer'));
			map.on('mouseleave', 'art-place-points', () => (map.getCanvas().style.cursor = ''));
			mapReady = true;
		});
		return () => map.remove();
	});
</script>

<svelte:head>
	<title>Liberating Spaces — Lake Street Art Map</title>
	<meta name="description" content="Explore art, culture, and community spaces along Lake Street in Minneapolis." />
</svelte:head>

<main class="app-shell">
	<aside class="sidebar">
		<a class="brand" href="/" aria-label="Liberating Spaces home"><span class="brand-mark">LS</span><span><strong>Liberating Spaces</strong><small>Lake Street Art Map</small></span></a>
		<div class="sidebar-heading"><div><p class="eyebrow">EXPLORE THE COLLECTION</p><h1>Places & stories</h1></div><span class="count">{visiblePlaces.length}</span></div>
		<label class="search"><span aria-hidden="true">⌕</span><input bind:value={search} placeholder="Search places or addresses" aria-label="Search places or addresses" /></label>
		<div class="filters">
			<label><span>Type</span><select bind:value={typeFilter}>{#each types as type, key}<option>{type[key]}</option>{/each}</select></label>
			<label><span>Status</span><select bind:value={statusFilter}>{#each statuses as status, key}<option>{status[key]}</option>{/each}</select></label>
		</div>
		<div class="place-list" aria-label="Map locations">
			{#each visiblePlaces as place, i (i)}
				<button class:active={selected === place} class="place-card" onclick={() => choose(place)}>
					<span class="place-dot" data-status={place.properties.Still_there_}></span>
					<span class="place-copy"><strong>{place.properties.Name}</strong><small>{place.properties.Address}</small><span class="tags"><em>{place.properties.Type}</em><em>{place.properties.Still_there_}</em></span></span>
				</button>
			{:else}<p class="empty">No places match those filters.</p>{/each}
		</div>
		<p class="sidebar-foot">Mapping the art, culture, and people shaping Lake Street.</p>
	</aside>
	<section class="map-panel" aria-label="Interactive Lake Street map">
		<header class="map-header"><div><p class="eyebrow">MINNEAPOLIS, MINNESOTA</p><h2>Art lives here.</h2></div><span class="map-total">{places.length} locations <i></i> Interactive map</span></header>
		<div class="map-wrap"><div bind:this={mapElement} class="map" aria-label="Map of Lake Street places"></div>
			{#if selected}<article class="place-popup"><button class="close" aria-label="Close place details" onclick={() => (selected = null)}>×</button><p class="eyebrow">{selected.properties.Type} · {selected.properties.Still_there_}</p><h3>{selected.properties.Name}</h3><p>{selected.properties.Address}</p></article>{/if}
			{#if !mapReady}<div class="map-loading">Loading the map…</div>{/if}
			<div class="map-legend"><strong>Place status</strong><span><i class="present"></i> Present</span><span><i class="future"></i> Future</span><span><i class="past"></i> Past / gone</span></div>
		</div>
		<footer class="map-footer"><span>Scroll to zoom · Drag to explore · Select a point for details</span><span>Lake Street, Minneapolis</span></footer>
	</section>
</main>

<style>
	:global(*){box-sizing:border-box} :global(body){margin:0;background:#f4f1e9;color:#242720;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
	.app-shell{height:100vh;min-height:560px;display:grid;grid-template-columns:360px minmax(0,1fr);overflow:hidden;background:#f7f5ef}
	.sidebar{display:flex;flex-direction:column;min-height:0;background:#fbfaf6;border-right:1px solid #e8e5dc;padding:22px 20px 14px}
	.brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:inherit;padding:3px 2px 22px}.brand-mark{height:38px;width:38px;border-radius:12px;background:#244a3b;color:#f9f7ee;display:grid;place-items:center;font-family:Georgia,serif;font-weight:bold;font-size:14px}.brand strong,.brand small{display:block}.brand strong{font-family:Georgia,serif;font-size:17px;font-weight:600;letter-spacing:-.2px}.brand small{font-size:11px;color:#85887e;margin-top:3px;letter-spacing:.3px}
	.sidebar-heading{display:flex;align-items:end;justify-content:space-between;padding:21px 2px 15px;border-top:1px solid #e9e6df}.eyebrow{font-size:9px;letter-spacing:1.45px;font-weight:700;color:#8c8e83;margin:0 0 7px}.sidebar-heading h1,.map-header h2{font-family:Georgia,"Times New Roman",serif;font-size:25px;letter-spacing:-.6px;font-weight:500;margin:0}.count{border-radius:20px;background:#eeece4;color:#62675e;font-size:11px;font-weight:650;padding:5px 9px;margin-bottom:2px}
	.search{height:39px;border:1px solid #e6e3da;border-radius:7px;background:white;display:flex;align-items:center;gap:8px;padding:0 11px;color:#777d70}.search span{font-size:22px;line-height:1;transform:rotate(-20deg)}.search input{border:0;outline:0;width:100%;font:inherit;font-size:12px;background:transparent;color:#252820}.search input::placeholder{color:#a2a398}
	.filters{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:13px 0 12px}.filters label{font-size:10px;color:#888b80}.filters select{display:block;width:100%;margin-top:5px;border:1px solid #e6e3da;border-radius:6px;background:white;padding:7px 6px;color:#43473f;font-size:11px;outline-color:#73917f}
	.place-list{flex:1;overflow:auto;margin:0 -8px;padding:0 8px}.place-card{border:0;border-top:1px solid #eeece5;background:transparent;width:100%;display:flex;gap:11px;text-align:left;padding:12px 7px;cursor:pointer;color:inherit;border-radius:4px}.place-card:hover,.place-card.active{background:#f0f1e9}.place-dot{margin-top:4px;flex:0 0 9px;height:9px;border-radius:50%;background:#d29a38}.place-dot[data-status="Present"]{background:#16856b}.place-dot[data-status="Future"]{background:#7450b8}.place-dot[data-status="Gone"]{background:#c05b48}.place-copy{min-width:0}.place-copy strong{display:block;font-family:Georgia,serif;font-size:14px;font-weight:600;line-height:1.25}.place-copy small{display:block;color:#898b80;font-size:10px;margin-top:4px}.tags{display:flex;gap:5px;margin-top:7px}.tags em{font-style:normal;font-size:9px;color:#6d7166;background:#f0efe9;border-radius:3px;padding:3px 5px}.empty{font-size:12px;color:#898b80;padding:14px}.sidebar-foot{font-size:10px;line-height:1.5;color:#8e9085;border-top:1px solid #e9e6df;padding:12px 2px 0;margin:9px 0 0}
	.map-panel{display:flex;flex-direction:column;min-width:0;padding:0 25px 15px}.map-header{height:83px;display:flex;align-items:center;justify-content:space-between}.map-header h2{font-size:24px}.map-header .eyebrow{margin-bottom:5px}.map-total{display:flex;align-items:center;gap:8px;border:1px solid #e4e1d8;background:#fbfaf6;border-radius:20px;padding:8px 12px;font-size:10px;color:#65695f}.map-total i{width:3px;height:3px;border-radius:50%;background:#9c9e94}.map-wrap{position:relative;flex:1;min-height:0;border:1px solid #deddd5;border-radius:9px;overflow:hidden;background:#e9e6dc;box-shadow:0 2px 7px #21251a0b}.map{position:absolute;inset:0}.map-loading{position:absolute;inset:0;display:grid;place-items:center;color:#777b70;background:#eae8df;font-size:13px;pointer-events:none}.place-popup{position:absolute;top:16px;left:16px;width:min(270px,calc(100% - 32px));padding:16px 35px 15px 16px;background:#fffdf8;border:1px solid #ebe6da;border-radius:8px;box-shadow:0 5px 20px #20251b1a}.place-popup h3{font-family:Georgia,serif;font-size:19px;margin:0 0 7px;font-weight:600}.place-popup p:last-child{font-size:11px;color:#74786c;margin:0}.place-popup .eyebrow{margin-bottom:6px}.close{position:absolute;right:10px;top:8px;border:0;background:none;color:#72766d;font-size:21px;cursor:pointer}.map-legend{position:absolute;bottom:13px;left:13px;display:flex;align-items:center;gap:12px;background:#fffdf6ed;border:1px solid #e4e1d8;border-radius:6px;padding:9px 11px;box-shadow:0 2px 8px #20251b12;color:#62665c;font-size:9px}.map-legend strong{font-size:9px;color:#33372f;margin-right:2px}.map-legend span{display:flex;align-items:center;gap:5px}.map-legend i{width:7px;height:7px;border-radius:50%;background:#d29a38}.map-legend i.present{background:#16856b}.map-legend i.future{background:#7450b8}.map-legend i.past{background:#c05b48}.map-footer{height:29px;display:flex;align-items:end;justify-content:space-between;color:#8a8c82;font-size:9px;letter-spacing:.1px}
	:global(.maplibregl-ctrl-group){border-radius:6px!important;overflow:hidden;box-shadow:0 2px 8px #20251b18!important}:global(.maplibregl-ctrl-attrib){font-size:9px!important}
	@media(max-width:760px){.app-shell{grid-template-columns:1fr;grid-template-rows:minmax(235px,36vh) 1fr;height:100dvh}.sidebar{grid-row:2;padding:13px 15px 10px;border-right:0;border-top:1px solid #e8e5dc}.brand{display:none}.sidebar-heading{padding:0 1px 10px;border:0}.sidebar-heading h1{font-size:20px}.filters{padding:9px 0}.place-list{max-height:24vh}.sidebar-foot{display:none}.map-panel{grid-row:1;padding:0 12px 8px}.map-header{height:54px}.map-header h2{font-size:19px}.map-header .eyebrow{font-size:8px}.map-total{font-size:9px;padding:6px 9px}.map-footer{font-size:8px}.map-legend{gap:7px;padding:7px 8px;font-size:8px}.map-legend strong{display:none}}
</style>
