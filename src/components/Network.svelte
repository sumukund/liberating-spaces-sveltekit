<script>
	import * as d3 from 'd3';
	import { onMount } from 'svelte';
	import { pangea_structure, tctocc_structure } from '#lib/network_map_data.js';

	let container;

	// Convert the organization-shaped source data into the renderer's common
	// nodes/links format. Other network sources can provide that format directly.
	function toGraph(structure) {
		const nodes = [];
		const links = [];
		const addNode = (item, group, parent) => {
			nodes.push({ id: item.id, name: item.name, group });
			if (parent) links.push({ source: parent, target: item.id, type: 'structure' });
		};
		const organization = { id: 'pangea', name: structure.company };
		addNode(organization, 'Organization');
		for (const department of structure.departments ?? []) {
			addNode(department, 'Department', organization.id);
			for (const program of department.programs ?? []) addNode(program, 'Program', department.id);
		}
		for (const project of structure.collaborative_projects ?? []) addNode(project, 'Project', organization.id);
		for (const collaborator of structure.collaborators ?? []) addNode(collaborator, 'Collaborator', organization.id);
		for (const project of structure.collaborative_projects ?? []) {
			for (const collaborator of project.collaborators ?? []) {
				if (!nodes.some((node) => node.id === collaborator.id)) {
					addNode(collaborator, 'Collaborator');
				}
				links.push({ source: project.id, target: collaborator.id, type: 'collaboration' });
			}
		}
		return { nodes, links };
	}

	function graphFromNetworks(networks, connections = []) {
		const nodes = [];
		const links = [];
		const nodeIds = new Set();
		const linkIds = new Set();
		const addLink = (source, target, type = 'structure') => {
			const key = [source, target].sort().join('::');
			if (linkIds.has(key)) return;
			linkIds.add(key);
			links.push({ source, target, type });
		};
		const addNode = (item, group, parent) => {
			if (!nodeIds.has(item.id)) {
				nodeIds.add(item.id);
				nodes.push({ id: item.id, name: item.name, group });
			}
			if (parent) addLink(parent, item.id);
		};

		for (const network of networks) {
			for (const node of network.nodes) addNode(node, node.group);
			for (const edge of network.links) addLink(edge.source, edge.target, edge.type);
		}
		for (const connection of connections) {
			addLink(connection.source, connection.target, connection.type ?? 'network-connection');
		}

		return { nodes, links };
	}

	onMount(() => {
		const pangea = toGraph(pangea_structure);
		const tctocc = {
			nodes: [
				{ id: 'tctocc', name: 'Twin Cities Theater of Color Coalition', group: 'Network' },
				...tctocc_structure.map((theater, index) => ({
					id: `tctocc:theater-${index}`,
					name: theater.theater_name,
					group: 'TCTOCC Theater'
				}))
			],
			links: tctocc_structure.map((_, index) => ({
				source: 'tctocc',
				target: `tctocc:theater-${index}`,
				type: 'coalition'
			}))
		};
		// Keep each network's internal links separate; declare bridges between
		// networks explicitly so additional networks can be connected the same way.
		const connections = [
			{ source: 'pangea', target: 'tctocc', type: 'network-connection' }
		];
		const { nodes, links } = graphFromNetworks([pangea, tctocc], connections);
		const width = 900;
		const height = 800;
		const svg = d3
			.select(container)
			.append('svg')
			.attr('viewBox', `0 0 ${width} ${height}`)
			.attr('role', 'img')
			.attr('aria-label', `${pangea_structure.company} and TCTOCC network`)
			.style('width', '100%')
			.style('height', 'auto');

		const color = d3.scaleOrdinal(d3.schemeTableau10);
		const simulation = d3
			.forceSimulation(nodes)
			.force('link', d3.forceLink(links).id((node) => node.id).distance(50))
			.force('charge', d3.forceManyBody().strength(-350))
			.force('center', d3.forceCenter(width / 2, height / 2))
			.force('collide', d3.forceCollide(34));

		const link = svg
			.append('g')
			.attr('stroke-opacity', 0.7)
			.selectAll('line')
			.data(links)
			.join('line')
			.attr('stroke-width', 1)
			.attr('stroke', (d) => {
				if (d.type === 'collaboration') return '#e11d48';
				if (d.type === 'coalition') return '#7c3aed';
				if (d.type === 'network-connection') return '#2563eb';
				return '#a8a29e';
			});

		const node = svg
			.append('g')
			.selectAll('g')
			.data(nodes)
			.join('g')
			.call(
				d3
					.drag()
					.on('start', (event, d) => {
						if (!event.active) simulation.alphaTarget(0.3).restart();
						d.fx = d.x;
						d.fy = d.y;
					})
					.on('drag', (event, d) => {
						d.fx = event.x;
						d.fy = event.y;
					})
					.on('end', (event, d) => {
						if (!event.active) simulation.alphaTarget(0);
						d.fx = null;
						d.fy = null;
					})
			);

		node
			.append('circle')
			.attr('r', (d) => (d.group === 'Organization' ? 13 : 8))
			.attr('fill', (d) => color(d.group))
			.attr('stroke', 'white')
			.attr('stroke-width', 1.5);

		node
			.append('text')
			.text((d) => d.name)
			.attr('x', 12)
			.attr('y', 4)
			.attr('font-size', 12)
			.attr('paint-order', 'stroke')
			.attr('stroke', 'white')
			.attr('stroke-width', 3)
			.attr('stroke-linejoin', 'round');

		node.append('title').text((d) => `${d.name} · ${d.group}`);

		simulation.on('tick', () => {
			link
				.attr('x1', (d) => d.source.x)
				.attr('y1', (d) => d.source.y)
				.attr('x2', (d) => d.target.x)
				.attr('y2', (d) => d.target.y);
			node.attr('transform', (d) => `translate(${d.x},${d.y})`);
		});

		return () => simulation.stop();
	});
</script>

<div bind:this={container} class="network-chart"></div>

<style>
	.network-chart {
		width: 100%;
		overflow: hidden;
	}
</style>
