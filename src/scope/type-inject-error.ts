import type { ScopeValueName } from './value';

/** The error when the user is not permitted to operate on a resource. */
export class TypeInjectError extends TypeError {
	constructor(name: ScopeValueName, as: string, value: unknown) {
		super(`Tried to get value ${name} as ${as}, but ${value} does not meet that criteria`);
		Object.setPrototypeOf(this, TypeInjectError.prototype);
	}
}
