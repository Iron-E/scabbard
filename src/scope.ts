import type { Constructor, InstanceOf, SupersetOf, TheTypeOf, TypeOf, UnionOf } from './util';
import type { ScopeValue, PreparedValue, ProvideWith, ScopeValueName, UnpreparedValue } from './scope/value';
import { DependencyTree } from './dependencies';
import { DuplicateValueError } from './scope/duplicate-error';
import { UnpreparedError } from './scope/unprepared-error';

export type { ScopeValue, PreparedValue, ProvideWith, ScopeValueName, UnpreparedValue };
export { UnpreparedError, DuplicateValueError };

/** Options for {@link Scope.inject}. */
export type UseOpts<T = unknown> = UnionOf<Readonly<{
	/** The value is instantiated `from` the given class */
	from: Constructor<T>,

	/** The value is `T`, `if` this function says so */
	if: (value: unknown) => value is T,

	/** The value is a basic `typeof` data */
	of: TypeOf,
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

	/** The names of all the values in scope */
	public get names(): string[] {
		return Object.keys(this.values);
	}

	/** The number of values in scope */
	public get size(): number {
		return this.names.length;
	}

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
		const value = this.values[name];
		if (value === undefined) {
			throw new ReferenceError(`Attempted to prepare value ${name} before it was provided`);
		}

		return value;
	}

	/**
	 * @param name the identifier of the value to use
	 * @param opts options options for the use of the value
	 * @returns the requested value
	 * @throws UnpreparedError if this function is called before {@link Resource} is available
	 * @throws TypeError if the requested value is not of the specified type
	 */
	public inject<T extends TypeOf>(this: this, name: ScopeValueName, ty: Extract<UseOpts<T>, { if: any }>): TheTypeOf<T>;
	public inject<T>(this: this, name: ScopeValueName, ty: Extract<UseOpts<T>, { test: any }>): T;
	public inject<T>(this: this, name: ScopeValueName, ty: Extract<UseOpts<T>, { from: any }>): InstanceOf<T>;
	public inject<T>(this: this, name: ScopeValueName, ty: UseOpts<T>) {
		const value = this.values[name];
		if (value === undefined || !value.prepared) {
			throw new UnpreparedError(name);
		}

		if ('if' in ty) {
			if (ty.if(value.cached)) {
				return value.cached;
			}
		} else if ('from' in ty) {
			if (value.cached instanceof ty.from) {
				return value.cached;
			}
		} else {
			if (typeof value.cached === ty.of) {
				return value.cached;
			}
		}

		const ty_ = ty as SupersetOf<UseOpts<T>>;
		throw new TypeError(`Tried to get value ${name} as ${(ty_.if ?? ty_.from)?.name ?? ty_.of}, \
but ${value} does not meet that criteria`);
	}

	/**
	 * Define a value with the given `name`, that can be {@link inject}ed after {@link Resource} is provided.
	 * @param name of the value
	 * @param with_ how to provide the value
	 * @throws DuplicateValueError if `name` was already defined
	 * @throws TypeError if `with_` is not given
	 */
	public provide(this: this, name: ScopeValueName, with_: (scope: Resource) => unknown): this;
	public provide(this: this, name: ScopeValueName, dependencies: ScopeValueName[], with_: (scope: Resource) => unknown): this;
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
		return this;
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
			const value = this.indexValues(dependency);
			if (value.prepared) { // has been prepared previously
				continue;
			}

			const cached = value.fn(scope);
			this.values[dependency] = { cached, prepared: true };
		}
	}
}
