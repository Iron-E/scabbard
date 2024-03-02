import type { ScopeValueName } from './value';

/** The error when the user is not permitted to operate on a resource. */
export class DuplicateValueError extends Error {
	constructor(name: ScopeValueName) {
		super(`Scope value with name ${name} but it `);
		Object.setPrototypeOf(this, DuplicateValueError.prototype);
	}
}
