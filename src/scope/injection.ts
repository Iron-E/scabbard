import type { Constructor, InstanceOf, TheTypeOf, TypeOf } from '../util';
import type { InjectionName } from './injection/name';
import { TypeInjectError } from './injection/type-inject-error';

export type { InjectionName };
export { TypeInjectError };

export class Injection {
	public constructor(public readonly name: InjectionName, public readonly value: unknown) { }

	/**
	 * @returns {@link value} as a `bigint`
	 * @throws {@link TypeInjectError} if the value is not of the type described
	 */
	public get bigint(): bigint { return this.type('bigint'); }

	/**
	 * @returns {@link value} as a `boolean`
	 * @throws {@link TypeInjectError} if the value is not of the type described
	 */
	public get boolean(): boolean { return this.type('boolean'); }

	/**
	 * @returns {@link value} as a `function`
	 * @throws {@link TypeInjectError} if the value is not of the type described
	 */
	public get function(): Function { return this.type('function'); }

	/**
	 * @returns {@link value} as a `number`
	 * @throws {@link TypeInjectError} if the value is not of the type described
	 */
	public get number(): number { return this.type('number'); }

	/**
	 * @returns {@link value} as a `object`
	 * @throws {@link TypeInjectError} if the value is not of the type described
	 */
	public get object(): object { return this.type('object'); }

	/**
	 * @returns {@link value} as a `string`
	 * @throws {@link TypeInjectError} if the value is not of the type described
	 */
	public get string(): string { return this.type('string'); }

	/**
	 * @returns {@link value} as a `symbol`
	 * @throws {@link TypeInjectError} if the value is not of the type described
	 */
	public get symbol(): symbol { return this.type('symbol'); }

	/**
	 * @returns {@link value} as a `undefined`
	 * @throws {@link TypeInjectError} if the value is not of the type described
	 */
	public get undefined(): undefined { return this.type('undefined'); }

	/**
	 * @param name of the value to inject
	 * @param check the typecheck to assert
	 * @returns the value associated with `name`, given the type desired
	 * @throws {@link TypeInjectError} if the value is not of the type described
	 */
	check<T>(this: this, checkFn: (value: unknown) => value is T): T {
		if (checkFn(this.value)) {
			return this.value;
		}

		throw new TypeInjectError(this.name, checkFn.name, this.value);
	}

	/**
	 * @param name of the value to inject
	 * @param of the class which the value is an `instanceof`
	 * @returns the value associated with `name`, given the type desired
	 * @throws {@link TypeInjectError} if the value is not of the type described
	 */
	instance<T>(this: this, of: Constructor<T>): InstanceOf<T> {
		if (this.value instanceof of) {
			return this.value;
		}

		throw new TypeInjectError(this.name, of.name, this.value);
	}

	/**
	 * @param name of the value to inject
	 * @param of the `typeof` the value
	 * @returns the value associated with `name`, given the type desired
	 * @throws {@link TypeInjectError} if the value is not of the type described
	 */
	type<T extends TypeOf>(this: this, of: T): TheTypeOf<T> {
		if (typeof this.value === of) {
			return this.value as TheTypeOf<T>;
		}

		throw new TypeInjectError(this.name, of, this.value);
	}
}
