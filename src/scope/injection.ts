import type { Constructor, InstanceOf, TheTypeOf, TypeOf } from '../util';
import { TypeInjectError } from './injection/type-inject-error';

export { TypeInjectError };

type InjectValue<Required extends boolean = true, T = unknown> = Required extends true ? T : T | undefined;

/**
 * An unknown value which may be narrowed.
 * @param <Required> whether the injection value can be `undefined`
 */
export class Injection<Required extends boolean = true> {
	public constructor(
		/** The raw value of the injection */
		public readonly value: unknown,

		/** Whether the {@link value} may be `undefined` if typ  */
		private _required: Required,
	) { }

	/** @returns an injection whose value is optional */
	public get optional(): Injection<false> {
		return new Injection(this.value, false);
	}

	/** @returns an injection whose value is required */
	public get required(): Injection<true> {
		return new Injection(this.value, true);
	}

	/**
	 * @returns if this injection value is not required, and the value is `undefined`.
	 */
	private get valueIsOptionalAndUndefined(): boolean {
		return (!this._required) && this.value === undefined;
	}

	/**
	 * @param name of the value to inject
	 * @param check the typecheck to assert
	 * @returns the value associated with `name`, given the type desired
	 * @throws {@link TypeInjectError} if the value is not of the type described
	 */
	public check = <T>(checkFn: (value: unknown) => value is T): InjectValue<Required, T> => {
		if (checkFn(this.value)) {
			return this.value;
		} else if (this.valueIsOptionalAndUndefined) {
			return undefined as InjectValue<Required, T>;
		}

		throw new TypeInjectError(checkFn.name, this.value);
	}

	/**
	 * @param name of the value to inject
	 * @param of the class which the value is an `instanceof`
	 * @returns the value associated with `name`, given the type desired
	 * @throws {@link TypeInjectError} if the value is not of the type described
	 */
	public readonly instance = <T>(of: Constructor<T>): InjectValue<Required, InstanceOf<T>> => {
		if (this.value instanceof of) {
			return this.value;
		} else if (this.valueIsOptionalAndUndefined) {
			return undefined as InjectValue<Required, InstanceOf<T>>;
		}

		throw new TypeInjectError(of.name, this.value);
	}

	/**
	 * @param name of the value to inject
	 * @param of the `typeof` the value
	 * @returns the value associated with `name`, given the type desired
	 * @throws {@link TypeInjectError} if the value is not of the type described
	 */
	public readonly type = <T extends TypeOf>( of: T): InjectValue<Required, TheTypeOf<T>> => {
		if (typeof this.value === of) {
			return this.value as TheTypeOf<T>;
		} else if (this.valueIsOptionalAndUndefined) {
			return undefined as InjectValue<Required, TheTypeOf<T>>;
		}

		throw new TypeInjectError(of, this.value);
	}
}
