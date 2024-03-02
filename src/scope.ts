import type { Constructor, InstanceOf, UnionOf } from './util';
import type { ScopeValue, PreparedValue, ProvideWith, ScopeValueName, UnpreparedValue } from './scope/value';
import { DependencyTree } from './dependencies';
import { DuplicateValueError } from './scope/duplicate-error';
import { UnpreparedError } from './scope/unprepared-error';

export type { ScopeValue, PreparedValue, ProvideWith, ScopeValueName , UnpreparedValue };
export { UnpreparedError, DuplicateValueError };

/** Options for {@link Scope.inject}. */
export type UseOpts<T = unknown> = UnionOf<Readonly<{
	/** A test to see if the value is the type */
	is: (value: unknown) => value is T,

	/** A type which the value is an `instanceof` */
	Ty: Constructor<T>,
}>>

/**
 * A mechanism to {@link define | provide} in terms of a {@link Resource}, so that once it becomes available the values can be {@link inject}ed into lexical scopes.
 */
export class Scope<Resource = unknown> {
	constructor(
		/** The dependencies between {@link values} */
		private dependencyTree: DependencyTree = new DependencyTree(),

		/** That which can be {@link inject}ed by the scope */
		private values: Record<ScopeValueName, ScopeValue<Resource>> = {},
	) { }

	/**
	 * Clears the state of the scope provider.
	 */
	public clear(this: this): void {
		this.dependencyTree.clear();
		this.values = {};
	}

	/**
	 * @param name the name of the value
	 * @throws ReferenceError when `name` is not in the `state`
	 */
	private indexValues(this: this, name: ScopeValueName): ScopeValue<Resource> {
		const item = this.values[name];
		if (item === undefined) {
			throw new ReferenceError(`Attempted to prepare value ${name} before it was provided`);
		}

		return item;
	}

	/**
	 * @param name the identifier of the value to use
	 * @param opts options options for the use of the value
	 * @returns the requested value
	 * @throws UnpreparedError if this function is called before {@link Resource} is available
	 * @throws TypeError if the requested value is not of the specified type
	 */
	public inject<T>(this: this, name: ScopeValueName, opts: Exclude<UseOpts<T>, { Ty: any }>): T;
	public inject<T>(this: this, name: ScopeValueName, opts: Exclude<UseOpts<T>, { is: any }>): InstanceOf<T>;
	public inject<T>(this: this, name: ScopeValueName, opts: UseOpts<T>) {
		const item = this.values[name];
		if (item === undefined || !item.prepared) {
			throw new UnpreparedError(name);
		}

		if ('is' in opts) {
			if (opts.is(item.value)) {
				return item.value;
			}
		} else if (item.value instanceof opts.Ty) {
			return item.value;
		}

		throw new TypeError(`Tried to get value ${name} as ${('is' in opts ? opts.is : opts.Ty).name}, \
but ${item} does not meet that criteria`);
	}

	/**
	 * Define a value with the given `name`, that can be {@link inject}ed after {@link Resource} is provided.
	 * @param name of the value
	 * @param with_ how to provide the value
	 * @throws DuplicateValueError if `name` was already defined
	 * @throws TypeError if `with_` is not given
	 */
	public provide(this: this, name: ScopeValueName, with_: (scope: Resource) => unknown): void;
	public provide(this: this, name: ScopeValueName, dependencies: ScopeValueName[], with_: (scope: Resource) => unknown): void;
	public provide(
		this: this,
		name: ScopeValueName,
		fnOrDepends: ScopeValueName[] | ProvideWith<Resource>,
		with_?: ProvideWith<Resource>,
	) {
		if (name in this.values) {
			throw new DuplicateValueError(name);
		}

		if (typeof fnOrDepends === 'function') {
			with_ = fnOrDepends;
		} else {
			this.dependencyTree.on(fnOrDepends, name);
			if (with_ === undefined) {
				throw new TypeError('Must specify function to provide with');
			}
		}

		this.values[name] = { prepared: false, fn: with_ };
	}

	/**
	 * @param name the value to prepare
	 * @param scope the scope of the value
	 * @throws ReferenceError when `name` (or one of its dependencies) was not {@link provide}d
	 * @see {@link provide}
	 */
	public prepareWith(this: this, name: ScopeValueName, scope: Resource): void {
		if (this.indexValues(name)) {
			return; // has been prepared previously
		}

		const order = this.dependencyTree.loadOrder(name);
		for (const dependency of order) {
			const item = this.indexValues(dependency);
			if (item.prepared) { // has been prepared previously
				continue;
			}

			const value = item.fn(scope);
			this.values[dependency] = { prepared: true, value };
		}
	}
}
