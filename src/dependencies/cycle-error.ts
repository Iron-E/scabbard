import type { DepName } from './dependency';

/** The error when the user is not permitted to operate on a resource. */
export class DependencyCycleError extends Error {
	constructor(from: DepName, to: DepName) {
		super(`Cyclical dependency detected from ${String(from)} to ${String(to)}`);
		Object.setPrototypeOf(this, DependencyCycleError.prototype);
	}
}
