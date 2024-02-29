import { type InspectOptions, inspect } from 'util';

declare global {
	interface Set<T> {
		/** @returns a human-readable representation of the set. */
		 [inspect.custom](this: Set<T>, depth: number, inspectOptions: InspectOptions, baseInspect: typeof inspect): string;
	}
}

Set.prototype[inspect.custom] = function <T>(this: Set<T>, _depth: number, inspectOptions: InspectOptions, baseInspect: typeof inspect) {
	return `Set ${baseInspect(Array.from(this), inspectOptions)}`;
}
