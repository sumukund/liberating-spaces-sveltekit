<!-- <script lang="ts">
	import List from './List.svelte';
	import Map from './Map.svelte';
	import Network from './Network.svelte';
	import MapResultForm from './MapResultForm.svelte';
	import Individuals from './Individuals.svelte';
</script>


	<div class="network"><Network /></div>
	<div class='network'><Individuals /></div>
<style>
	:global(*) { box-sizing: border-box; }
	:global(html) { scroll-behavior: smooth; background: #f3efe7; }
	:global(body) { margin: 0; color: #252922; font-family: 'Courier New', Courier, monospace; }
	.network { max-width: 928px; max-height: auto; margin: auto; display: flex; background:  #f3efe7;  }

	.map-page { max-width: 1600px; margin: auto; display: grid; grid-template-columns: 40% 60%; align-items: stretch; background: #f3efe7; }
	.pane { min-width: 0; }
	@media (max-width: 760px) { .map-page { display: flex; flex-direction: column-reverse; } .map-pane { width: 100%; height: 42vh; position: sticky; top: 0; z-index: 5; } .list-pane { width: 100%; } }
</style> -->

<script>
	import List from './List.svelte';
	import Map from './Map.svelte';
	import Network from './Network.svelte';
	import MapResultForm from './MapResultForm.svelte';
	import Individuals from './Individuals.svelte';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	const currentPage = writable('home');

	function navigate(page) {
		currentPage.set(page);
	}
</script>

<nav class="navbar">
	<button on:click={() => navigate('map')}>Map</button>
	<button on:click={() => navigate('network')}>Network</button>
	<button on:click={() => navigate('about')}>About</button>
</nav>

{#if $currentPage === 'map'}
<div class="map-page">
	<section class="pane list-pane"><List /></section>
	<section class="pane map-pane"><Map /></section>
	<section class="form">	<MapResultForm /></section>

</div>
{:else if $currentPage === 'network'}
	<div class="page-content">
		<Network />
		<Individuals />
	</div>
{:else if $currentPage === 'about'}
	<div class="page-content">
		<h1>About Us</h1>
		<p>Learn more about our mission and values.</p>
	</div>
{/if}

<style>
	.navbar {
		display: flex;
		justify-content: center;
		background: #252922;
		padding: 1rem;
	}
	.navbar button {
		margin: 0 1rem;
		padding: 0.5rem 1rem;
		color: #f3efe7;
		background: #252922;
		border: 1px solid #f3efe7;
		cursor: pointer;
	}
	.navbar button:hover {
		background: #f3efe7;
		color: #252922;
	}
:global(*) { box-sizing: border-box; }
	:global(html) { scroll-behavior: smooth; background: #f3efe7; }
	:global(body) { margin: 0; color: #252922; font-family: 'Courier New', Courier, monospace; }
	.network { max-width: 928px; max-height: auto; margin: auto; display: flex; background:  #f3efe7;  }

	.map-page { max-width: 1600px; margin: auto; display: grid; grid-template-columns: 40% 60%; align-items: stretch; background: #f3efe7; }
	.pane { min-width: 0; }
	@media (max-width: 760px) { .map-page { display: flex; flex-direction: column-reverse; } .map-pane { width: 100%; height: 42vh; position: sticky; top: 0; z-index: 5; } .list-pane { width: 100%; } }
</style>