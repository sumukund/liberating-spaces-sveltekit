<script lang="ts">
	import { onMount } from 'svelte';
	import type { GeoJSONSource, Map as MapLibreMapInstance } from 'maplibre-gl';
	import { activeChapter, activePlaces, focusPlace, selectedPlace } from './stores.js';
	import 'maplibre-gl/dist/maplibre-gl.css';
	type Place = { type: 'Feature'; geometry: { type: 'Point'; coordinates: [number, number] }; properties: { Name: string; Type: string; Still_there_: string; Address: string; description: string; _index?: number } };
	let mapElement: HTMLDivElement;
	let map: MapLibreMapInstance;
	let LngLatBoundsClass: typeof import('maplibre-gl').LngLatBounds;
	let ready = $state(false);
	let places = $state<Place[]>([]);
	let selected: Place | null = $state(null);
	const unsubscribePlaces = activePlaces.subscribe((value) => { places = value as Place[]; updatePlaces(); fitPlaces(); });
	const unsubscribeChapter = activeChapter.subscribe(() => fitPlaces());
	const unsubscribeFocus = focusPlace.subscribe((value) => { const focus = value as Place | null; if (focus) map?.flyTo({ center: focus.geometry.coordinates, zoom: 15, duration: 700 }); });
	const unsubscribeSelected = selectedPlace.subscribe((value) => selected = value as Place | null);
	function updatePlaces() { if (!ready || !map?.getSource('art-places')) return; (map.getSource('art-places') as GeoJSONSource).setData({ type: 'FeatureCollection', features: places }); }
	function fitPlaces() {
		if (!ready || !map || !places.length) return;
		const bounds = places.reduce((result, place) => result.extend(place.geometry.coordinates), new LngLatBoundsClass(places[0].geometry.coordinates, places[0].geometry.coordinates));
		map.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 800 });
	}
	onMount(() => {
		let disposed = false;
		async function createMap() {
			const { LngLatBounds, Map: MapLibreMap, NavigationControl } = await import('maplibre-gl');
			if (disposed) return;
			LngLatBoundsClass = LngLatBounds;
		const token = import.meta.env.VITE_MAPBOX_API_KEY;
		map = new MapLibreMap({ container: mapElement, center: [-93.25, 44.948], zoom: 12.5, style: token ? `https://api.mapbox.com/styles/v1/mapbox/light-v11?access_token=${token}` : { version: 8, sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap contributors' } }, layers: [{ id: 'osm', type: 'raster', source: 'osm' }] } });
		map.addControl(new NavigationControl(), 'top-right');
		map.on('load', () => {
			map.addSource('art-places', { type: 'geojson', data: { type: 'FeatureCollection', features: places } });
			map.addLayer({ id: 'art-place-points', type: 'circle', source: 'art-places', paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 15, 9], 'circle-color': ['match', ['get', 'Still_there_'], 'Present', '#16856b', 'Future', '#7450b8', 'Gone', '#c05b48', 'Past', '#c05b48', '#d29a38'], 'circle-stroke-color': '#fffaf2', 'circle-stroke-width': 2 } });
			map.on('click', 'art-place-points', (event) => { const feature = event.features?.[0] as unknown as Place | undefined; if (feature) selectedPlace.set(feature); });
			map.on('mouseenter', 'art-place-points', () => map.getCanvas().style.cursor = 'pointer');
			map.on('mouseleave', 'art-place-points', () => map.getCanvas().style.cursor = '');
			ready = true; updatePlaces(); fitPlaces();
		});
		}
		void createMap();
		return () => { disposed = true; map?.remove(); unsubscribePlaces(); unsubscribeChapter(); unsubscribeFocus(); unsubscribeSelected(); };
	});
</script>

<aside class="map-column" aria-label="Interactive Lake Street map">
	<div class="map-sticky"><div bind:this={mapElement} class="map" aria-label="Map of Lake Street locations"></div>{#if !ready}<div class="map-loading">Loading map…</div>{/if}{#if selected}<article class="popup"><button class="close" aria-label="Close details" onclick={() => selectedPlace.set(null)}>×</button><p class="eyebrow">{selected.properties.Type} · {selected.properties.Still_there_}</p><h2>{selected.properties.Name}</h2><p>{selected.properties.Address}</p></article>{/if}<div class="map-legend"><b>Current status</b><span><i class="present"></i>Present</span><span><i class="future"></i>Future</span><span><i class="past"></i>Past / Closed</span></div><div class="map-caption">{places.length} locations <span>·</span> Lake Street, Minneapolis</div></div>
</aside>

<style>
	.map-column{height:100vh;position:sticky;top:0;min-width:0;align-self:start;background:#e6e2d7}.map-sticky{height:100%;position:relative;overflow:hidden}.map{position:absolute;inset:0}.map-loading{position:absolute;inset:0;display:grid;place-items:center;background:#e6e2d7;color:#777;font-size:13px}.map-legend{position:absolute;left:20px;bottom:54px;display:flex;align-items:center;gap:12px;padding:11px 13px;background:#fffdf8ed;box-shadow:0 3px 16px #27241818;font-size:10px}.map-legend b{font-size:8px;letter-spacing:.13em}.map-legend span{display:flex;align-items:center;gap:5px}.map-legend i{width:8px;height:8px;display:inline-block;border-radius:50%;background:#bd5039}.map-legend .present{background:#16856b}.map-legend .future{background:#7450b8}.map-caption{position:absolute;left:20px;bottom:20px;font-size:10px;letter-spacing:.04em;color:#615f54}.map-caption span{padding:0 5px;color:#a44735}.popup{position:absolute;left:20px;top:20px;padding:22px 25px;background:#fffdf8;box-shadow:0 5px 25px #29271e25;max-width:290px}.eyebrow{font-size:9px;letter-spacing:.14em;font-weight:bold;color:#a44735;margin:0 0 10px}.popup h2{font:23px Georgia,serif;margin:0 0 8px}.popup p:last-child{font-size:12px;color:#69675d}.close{position:absolute;right:8px;top:5px;border:0;background:none;font-size:22px;cursor:pointer}
	@media(max-width:760px){.map-column{position:relative;top:auto;height:100%;min-height:0;width:100%;z-index:auto}.map-legend{left:10px;bottom:14px;gap:9px;padding:8px;font-size:9px}.map-legend b,.map-caption{display:none}.popup{left:10px;top:10px;padding:15px}.popup h2{font-size:18px}}
</style>
