import type { DepName } from './dep';

/** The error when the user is not permitted to operate on a resource. */
export class DependencyCycleError extends Error {
	constructor(existing: DepName, new_: DepName) {
		super(`Adding ${new_} to this group of dependencies would cause a cycle because of ${existing}`
		);
		Object.setPrototypeOf(this, DependencyCycleError.prototype);
	}
}
