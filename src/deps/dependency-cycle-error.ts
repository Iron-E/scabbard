import type { DepName } from './dep';

/** The error when the user is not permitted to operate on a resource. */
export class DependencyCycleError extends Error {
	constructor(from: DepName, to: DepName) {
		super(`Cyclical dependency detected from ${from} to ${to}`);
		Object.setPrototypeOf(this, DependencyCycleError.prototype);
	}
}