import { writable } from 'svelte/store';

// Shared map/list state. List owns the collection and current chapter; Map observes it.
export const activePlaces = writable([]);
export const selectedPlace = writable(null);
export const focusPlace = writable(null);
export const activeChapter = writable(0);
