<script lang="ts">
	import List from './List.svelte';
	import Map from './Map.svelte';
	import Timeline from './Timeline.svelte';
</script>

<main class="map-page">
	<section class="pane list-pane"><List /></section>
	<section class="pane map-pane"><Map /></section>
</main>

<Timeline />

<style>
	:global(*) { box-sizing: border-box; }
	:global(html) { scroll-behavior: smooth; background: #f3efe7; }
	:global(body) { margin: 0; color: #252922; font-family: Arial, Helvetica, sans-serif; }
	.map-page { max-width: 1600px; margin: auto; display: grid; grid-template-columns: 40% 60%; align-items: stretch; background: #f3efe7; }
	.pane { min-width: 0; }
	@media (max-width: 760px) { .map-page { display: flex; flex-direction: column-reverse; } .map-pane { width: 100%; height: 42vh; position: sticky; top: 0; z-index: 5; } .list-pane { width: 100%; } }
</style>
