<script lang="ts">
	import List from './List.svelte';
	import Map from './Map.svelte';
	import Timeline from './Timeline.svelte';
	import Network from './Network.svelte';
	import MapResultForm from './MapResultForm.svelte';
</script>

<div class="map-page">
	<section class="pane list-pane"><List /></section>
	<section class="pane map-pane"><Map /></section>
	<section class="form">	<MapResultForm /></section>

</div>
	<div class="network"><Network /></div>

<section><Timeline /></section>


<style>
	:global(*) { box-sizing: border-box; }
	:global(html) { scroll-behavior: smooth; background: #f3efe7; }
	:global(body) { margin: 0; color: #252922; font-family: 'Courier New', Courier, monospace; }
	.network { max-width: 1600px; max-height: auto; margin: auto; display: flex; background:  #f3efe7;  }

	.map-page { max-width: 1600px; margin: auto; display: grid; grid-template-columns: 40% 60%; align-items: stretch; background: #f3efe7; }
	.pane { min-width: 0; }
	@media (max-width: 760px) { .map-page { display: flex; flex-direction: column-reverse; } .map-pane { width: 100%; height: 42vh; position: sticky; top: 0; z-index: 5; } .list-pane { width: 100%; } }
</style>
