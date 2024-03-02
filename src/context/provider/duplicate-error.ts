import type { ProvisionName } from './provision';

/** The error when the user is not permitted to operate on a resource. */
export class DuplicateProvisionError extends Error {
	constructor(name: ProvisionName) {
		super(`Attempted to provide ${String(name)} but it was already provided`);
		Object.setPrototypeOf(this, DuplicateProvisionError.prototype);
	}
}
