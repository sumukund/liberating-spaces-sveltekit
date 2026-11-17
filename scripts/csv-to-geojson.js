#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

function parseCsv(text) {
	const rows = [];
	let row = [];
	let field = '';
	let quoted = false;

	for (let i = 0; i < text.length; i += 1) {
		const char = text[i];
		if (quoted) {
			if (char === '"' && text[i + 1] === '"') {
				field += '"';
				i += 1;
			} else if (char === '"') {
				quoted = false;
			} else {
				field += char;
			}
		} else if (char === '"' && field.length === 0) {
			quoted = true;
		} else if (char === ',') {
			row.push(field);
			field = '';
		} else if (char === '\n' || char === '\r') {
			if (char === '\r' && text[i + 1] === '\n') i += 1;
			row.push(field);
			if (row.some((value) => value.trim() !== '')) rows.push(row);
			row = [];
			field = '';
		} else {
			field += char;
		}
	}

	if (field.length || row.length) {
		row.push(field);
		if (row.some((value) => value.trim() !== '')) rows.push(row);
	}
	if (quoted) throw new Error('CSV contains an unclosed quoted field.');
	if (rows.length === 0) return [];

	const headers = rows[0].map((header) => header.trim().replace(/^\uFEFF/, ''));
	return rows.slice(1).map((values, index) => {
		if (values.length > headers.length) {
			throw new Error(`CSV row ${index + 2} has more values than the header.`);
		}
		return Object.fromEntries(headers.map((header, column) => [header, (values[column] ?? '').trim()]));
	});
}

export function csvToGeoJson(csv, { name = 'CSV import' } = {}) {
	const records = parseCsv(csv);
	const features = records.flatMap((record, index) => {
		const longitude = Number(record['geometry.longitude']);
		const latitude = Number(record['geometry.latitude']);
		if (
			record['geometry.longitude'] === '' ||
			record['geometry.latitude'] === '' ||
			!Number.isFinite(longitude) ||
			!Number.isFinite(latitude) ||
			longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90
		) {
			console.warn(`Skipping CSV row ${index + 2}: missing or invalid coordinates.`);
			return [];
		}

		const properties = {};
		for (const [header, value] of Object.entries(record)) {
			if (header.startsWith('properties.')) {
				properties[header.slice('properties.'.length)] = value;
			}
		}
		// The app reads Still_there_ directly; the source CSV stores it in description text.
		const status = properties.description?.match(/Still there\?:\s*([^<\n]+)/i)?.[1]?.trim();
		if (status && !properties.Still_there_) properties.Still_there_ = status;

		return [{
			type: 'Feature',
			properties,
			geometry: { type: record['geometry.type'] || 'Point', coordinates: [longitude, latitude] }
		}];
	});

	return { type: 'FeatureCollection', name, features };
}

async function main() {
	const [, , inputArg, outputArg] = process.argv;
	if (!inputArg) {
		console.error('Usage: npm run csv-to-geojson -- <input.csv> [output.geojson]');
		process.exitCode = 1;
		return;
	}
	const input = resolve(inputArg);
	const output = resolve(outputArg ?? input.replace(/\.csv$/i, '.geojson'));
	const geojson = csvToGeoJson(await readFile(input, 'utf8'), { name: basename(output, '.geojson') });
	await writeFile(output, `${JSON.stringify(geojson, null, 2)}\n`);
	console.log(`Wrote ${geojson.features.length} features to ${output}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		console.error(error.message);
		process.exitCode = 1;
	});
}
