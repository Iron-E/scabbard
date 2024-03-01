import { type InspectOptions, inspect } from 'util';

declare global {
	interface Set<T> {
		/** @returns a human-readable representation of the set. */
		[inspect.custom](this: Set<T>, depth: number, inspectOptions: InspectOptions, baseInspect: typeof inspect): string;

		/**
		 * @returns `true` if the array has no elements
		 */
		isEmpty(this: this): boolean;
	}

	interface ReadonlySet<T> {
		/** @returns a human-readable representation of the set. */
		[inspect.custom](this: Set<T>, depth: number, inspectOptions: InspectOptions, baseInspect: typeof inspect): string;

		/** @returns `true` if the array has no elements */
		isEmpty(this: this): boolean;
	}
}

Set.prototype[inspect.custom] = function <T>(this: Set<T>, _depth: number, inspectOptions: InspectOptions, baseInspect: typeof inspect) {
	return `Set ${baseInspect(Array.from(this), inspectOptions)}`;
}

Set.prototype.isEmpty = function<T>(this: Set<T>): boolean {
	return this.size > 0;
}
