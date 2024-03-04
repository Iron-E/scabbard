/** The error when the user is not permitted to operate on a resource. */
export class TypeInjectError extends TypeError {
	public constructor(as: string, value: unknown) {
		super(`Tried coercing with '${as}', but ${value} does not match`);
		Object.setPrototypeOf(this, TypeInjectError.prototype);
	}
}
