<script>
    import * as d3 from 'd3';
    import { onMount } from 'svelte';
    import { individuals } from '#lib/individual_network_map.js';

    let container;

    // Convert the entire array of individuals into a unified graph format
    function toGraph(individualsData) {
        const nodesMap = new Map();
        const links = [];

        // Helper to check if a name belongs to a core individual and get their official ID
        const getOrCreateNodeId = (name) => {
            const matched = individualsData.find(
                p => p.name.toLowerCase() === name.toLowerCase() || 
                     p.id === name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
            );
            if (matched) {
                return matched.id;
            }
            return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        };

        const addNode = (id, name, group) => {
            if (!nodesMap.has(id)) {
                nodesMap.set(id, { id, name, group });
            }
        };

        // 1. Add all core individuals first
        for (const person of individualsData) {
            addNode(person.id, person.name, 'Individual');
        }

        // 2. Add all top8 connections and handle friend nodes
        for (const person of individualsData) {
            if (person.top8 && Array.isArray(person.top8)) {
                for (const friendName of person.top8) {
                    const friendId = getOrCreateNodeId(friendName);
                    const isCore = individualsData.some(p => p.id === friendId);
                    
                    addNode(friendId, friendName, isCore ? 'Individual' : 'Friend');
                    links.push({ source: person.id, target: friendId, type: 'connection' });
                }
            }
        }

        return {
            nodes: Array.from(nodesMap.values()),
            links
        };
    }

    onMount(() => {
        const { nodes, links } = toGraph(individuals);
        const width = 928;
        const height = 680;
        const nodeRadius = (node) => (node.group === 'Individual' ? 12 : 7);
        const labelWidth = (node) => Math.min(width * 0.42, Math.max(36, node.name.length * 7));
        
        const svg = d3
            .select(container)
            .append('svg')
            .attr('viewBox', `0 0 ${width} ${height} `)
            .attr('role', 'img')
            .attr('aria-label', `Complete Individual Network Map`)
            .style('width', '100%')
            .style('height', 'auto');

        const color = d3.scaleOrdinal(d3.schemeTableau10);
        
        // Slightly adjusted force parameters to handle a larger network density
		const simulation = d3
			.forceSimulation(nodes)
			.force('link', d3.forceLink(links).id((node) => node.id).distance(50))
			.force('charge', d3.forceManyBody().strength(-350))
			.force('center', d3.forceCenter(width / 2, height / 2))
			.force('collide', d3.forceCollide((node) => nodeRadius(node) + 12));
            
        const link = svg
            .append('g')
            .attr('stroke-opacity', 0.6)
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke-width', 1.2)
            .attr('stroke', '#cbd5e1');

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
            .attr('r', nodeRadius)
            .attr('fill', (d) => color(d.group))
            .attr('stroke', 'white')
            .attr('stroke-width', 1.5);

        node
            .append('text')
            .text((d) => d.name)
            .attr('x', 10)
            .attr('y', 3)
            .attr('font-size', 11)
            .attr('paint-order', 'stroke')
            .attr('stroke', 'white')
            .attr('stroke-width', 3)
            .attr('stroke-linejoin', 'round')
            .attr('textLength', (d) => labelWidth(d))
            .attr('lengthAdjust', 'spacingAndGlyphs');

        node.append('title').text((d) => `${d.name} · ${d.group}`);

        simulation.on('tick', () => {
            // Keep node circles and their labels inside the SVG viewBox at every tick.
            for (const d of nodes) {
                const radius = nodeRadius(d);
                d.x = Math.max(radius + 2, Math.min(width - labelWidth(d) - 16, d.x));
                d.y = Math.max(radius + 3, Math.min(height - radius - 3, d.y));
            }
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
