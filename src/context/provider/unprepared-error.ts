import type { ProvisionName } from './provision';

/** The error when the user is not permitted to operate on a resource. */
export class UnpreparedError extends Error {
	constructor(name: ProvisionName) {
		super(`Attempted to provide ${String(name)}`);
		Object.setPrototypeOf(this, UnpreparedError.prototype);
	}
}
