import { writable } from 'svelte/store';

const config = {
	apiKey: import.meta.env.FIREBASE_API_KEY,
	projectId: import.meta.env.FIREBASE_PROJECT_ID
};
export const firebasePlaces = writable([]);
export const firebaseConfigured = Object.values(config).every(Boolean);
export const firebaseSignedIn = writable(false);
let idToken = '';
const endpoint = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/mapResults`;

function decodeValue(value) {
	if ('stringValue' in value) return value.stringValue;
	if ('doubleValue' in value) return Number(value.doubleValue);
	if ('integerValue' in value) return Number(value.integerValue);
	if ('booleanValue' in value) return value.booleanValue;
	if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(decodeValue);
	return null;
}
function encodeValue(value) {
	if (typeof value === 'string') return { stringValue: value };
	if (typeof value === 'number') return { doubleValue: value };
	if (typeof value === 'boolean') return { booleanValue: value };
	if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
	return { nullValue: null };
}
async function request(url, options = {}) {
	const headers = new Headers(options.headers);
	if (idToken) headers.set('Authorization', `Bearer ${idToken}`);
	const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}key=${config.apiKey}`, { ...options, headers });
	if (!response.ok) {
		const body = await response.json().catch(() => ({}));
		throw new Error(body.error?.message ?? `Firebase request failed (${response.status}).`);
	}
	return response.status === 204 ? null : response.json();
}

export async function signIn(email, password) {
	const result = await request('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword', {
		method: 'POST', headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password, returnSecureToken: true })
	});
	idToken = result.idToken;
	firebaseSignedIn.set(true);
	await refreshPlaces();
}
export function signOut() {
	idToken = '';
	firebaseSignedIn.set(false);
	firebasePlaces.set([]);
}

export async function refreshPlaces() {
	if (!firebaseConfigured) return;
	const result = await request(endpoint);
	firebasePlaces.set((result.documents ?? []).map((document) => ({
		id: document.name.split('/').at(-1),
		...Object.fromEntries(Object.entries(document.fields ?? {}).map(([key, value]) => [key, decodeValue(value)]))
	})));
}

export function watchPlaces(onError = console.error) {
	if (!firebaseConfigured) return () => {};
	const refresh = () => { void refreshPlaces().catch(onError); };
	refresh();
	const timer = setInterval(refresh, 5000);
	return () => clearInterval(timer);
}

export async function savePlace(place, id = '') {
	if (!firebaseConfigured) throw new Error('Add the Firebase API key and project ID to the environment to enable saving.');
	const { Name, Type, Still_there_, Address, description, coordinates } = place;
	const fields = Object.fromEntries(Object.entries({ Name, Type, Still_there_, Address, description, coordinates, updatedAt: new Date().toISOString() }).map(([key, value]) => [key, encodeValue(value)]));
	const url = id ? `${endpoint}/${encodeURIComponent(id)}?updateMask.fieldPaths=Name&updateMask.fieldPaths=Type&updateMask.fieldPaths=Still_there_&updateMask.fieldPaths=Address&updateMask.fieldPaths=description&updateMask.fieldPaths=coordinates&updateMask.fieldPaths=updatedAt` : endpoint;
	await request(url, { method: id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }) });
	await refreshPlaces();
}
