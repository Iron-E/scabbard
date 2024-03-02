import type { ScopeValueName } from './value';

/** The error when the user is not permitted to operate on a resource. */
export class UnpreparedError extends Error {
	constructor(name: ScopeValueName) {
		super(`Not prepared to to inject ${name}`);
		Object.setPrototypeOf(this, UnpreparedError.prototype);
	}
}
