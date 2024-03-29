import { inspect } from 'util';

const INSPECT_OPTIONS = { compact: true, depth: 1, maxArrayLength: 3, maxStringLength: 10 } as const;

/** The error when the user is not permitted to operate on a resource. */
export class TypeInjectError extends TypeError {
	public constructor(as: string, value: unknown) {
		super(`Tried coercing with '${as}', but ${inspect(value, INSPECT_OPTIONS)} does not match`);
		Object.setPrototypeOf(this, TypeInjectError.prototype);
	}
}
