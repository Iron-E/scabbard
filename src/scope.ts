import type { Constructor, InstanceOf, TheTypeOf, TypeOf } from './util';
import type { ScopeValue, PreparedValue, ProvideWith, ScopeValueName, UnpreparedValue } from './scope/value';
import { DependencyTree } from './dependencies';
import { DuplicateValueError } from './scope/duplicate-error';
import { TypeInjectError } from './scope/type-inject-error';
import { UnpreparedError } from './scope/unprepared-error';

export type { ScopeValue, PreparedValue, ProvideWith, ScopeValueName, UnpreparedValue };
export { DuplicateValueError, TypeInjectError, UnpreparedError };

/** Options for {@link Scope.inject}. */
export type UseOpts<T = unknown> = Readonly<{
	/** The value is `T`, `if` this function says so */
	check: (value: unknown) => value is T,

	/** The value is an instance `of` the given class */
	of: Constructor<T>,
}>;

/**
 * A mechanism to {@link define | provide} in terms of a {@link Resource}, so that once it becomes available the values can be {@link inject}ed into lexical scopes.
 */
export class Scope<Resource = unknown> {
	constructor(
		/** The dependencies between {@link values} */
		private readonly dependencyTree: DependencyTree = new DependencyTree(),

		/** That which can be {@link inject}ed by the scope */
		private readonly values: Map<ScopeValueName, ScopeValue<Resource>> = new Map(),
	) { }

	/** The names of all the values in scope */
	public get names(): IterableIterator<ScopeValueName> {
		return this.values.keys();
	}

	/** The number of values in scope */
	public get size(): number {
		return this.values.size;
	}

	/**
	 * Clears the state of the scope provider.
	 */
	public clear(this: this): void {
		this.dependencyTree.clear();
		this.values.clear();
	}

	/**
	 * Define what value will be given to `name` when the {@link Resource} is {@link prepareWith | provided}.
	 * @param name of the value
	 * @param dependencies what other declarations must be {@link prepareWith | prepared} before this
	 * @param as_ how to define the value
	 * @throws DuplicateValueError if `name` was already defined
	 * @throws TypeError if `with_` is not given
	 */
	public define(this: this, name: ScopeValueName, as_: (resource: Resource) => unknown): this;
	public define(this: this, name: ScopeValueName, dependencies: ScopeValueName[], as_: (resource: Resource) => unknown): this;
	public define(
		this: this,
		name: ScopeValueName,
		asOrDependencies: ScopeValueName[] | ProvideWith<Resource>,
		as_?: ProvideWith<Resource>,
	) {
		if (name in this.values) {
			throw new DuplicateValueError(name);
		}

		if (typeof asOrDependencies === 'function') {
			as_ = asOrDependencies;
		} else {
			this.dependencyTree.on(asOrDependencies, name);
			if (as_ === undefined) {
				throw new TypeError('Must specify function to provide with');
			}
		}

		this.values.set(name, { prepared: false, fn: as_ });
		return this;
	}

	/**
	 * @param name of the prepared value to get
	 * @returns the prepared value
	 * @throws ReferenceError if the `name` was not {@link defined}
	 * @throws UnpreparedError if `name` was not prepared
	 */
	private indexPreparedValues(this: this, name: ScopeValueName): PreparedValue {
		const value = this.indexValues(name);
		if (value === undefined || !value.prepared) {
			throw new UnpreparedError(name);
		}

		return value;
	}

	/**
	 * @param name the name of the value
	 * @throws ReferenceError when `name` is not in the `state`
	 */
	private indexValues(this: this, name: ScopeValueName): ScopeValue<Resource> {
		const value = this.values.get(name);
		if (value === undefined) {
			throw new ReferenceError(`Attempted to prepare value ${name} before it was provided`);
		}

		return value;
	}

	/**
	 * @param name of the value to inject
	 * @param check the typecheck to assert
	 * @returns the value associated with `name`, given the type desired
	 * @throws ReferenceError if the `name` was not {@link defined}
	 * @throws TypeInjectError if the value is not of the type described
	 * @throws UnpreparedError if the value is not ready to be used
	 */
	public inject<T>(this: this, name: ScopeValueName, check: (value: unknown) => value is T): T {
		const value = this.indexPreparedValues(name);
		if (check(value.cached)) {
			return value.cached;
		}

		throw new TypeInjectError(name, check.name, value);
	}

	/**
	 * @param name of the value to inject
	 * @param of the class which the value is an `instanceof`
	 * @returns the value associated with `name`, given the type desired
	 * @throws ReferenceError if the `name` was not {@link defined}
	 * @throws TypeInjectError if the value is not of the type described
	 * @throws UnpreparedError if the value is not ready to be used
	 */
	public injectInstance<T>(this: this, name: ScopeValueName, of: Constructor<T>): InstanceOf<T> {
		const value = this.indexPreparedValues(name);
		if (value.cached instanceof of) {
			return value.cached;
		}

		throw new TypeInjectError(name, of.name, value);
	}

	/**
	 * @param name of the value to inject
	 * @param of the `typeof` the value
	 * @returns the value associated with `name`, given the type desired
	 * @throws ReferenceError if the `name` was not {@link defined}
	 * @throws TypeInjectError if the value is not of the type described
	 * @throws UnpreparedError if the value is not ready to be used
	 */
	public injectType<T extends TypeOf>(this: this, name: ScopeValueName, of: T): TheTypeOf<T> {
		const value = this.indexPreparedValues(name);
		if (typeof value.cached === of) {
			return value.cached as TheTypeOf<T>;
		}

		throw new TypeInjectError(name, of, value);
	}

	/**
	 * @param resource to {@link prepareWith}
	 * @returns injectors which will use the resource to lazily prepare values as they are requested
	 */
	public prepareInjectors(this: this, resource: Resource): Pick<Scope<Resource>, 'inject' | 'injectInstance' | 'injectType'> {
		return {
			inject: this.prepareWrap(resource, this.inject, this),
			injectInstance: this.prepareWrap(resource, this.injectInstance, this),
			injectType: this.prepareWrap(resource, this.injectType, this),
		};
	}

	/**
	 * @param name the value to prepare
	 * @param resource the resource to provide the scope
	 * @throws ReferenceError when `name` (or one of its dependencies) was not {@link define}d
	 * @see {@link define}
	 */
	public prepareWith(this: this, name: ScopeValueName, resource: Resource): void {
		if (this.indexValues(name)) {
			return; // has been prepared previously
		}

		const order = this.dependencyTree.loadOrder(name);
		for (const dependency of order) {
			const value = this.indexValues(dependency);
			if (value.prepared) { // has been prepared previously
				continue;
			}

			const cached = value.fn(resource);
			this.values.set(dependency, { cached, prepared: true });
		}
	}

	/**
	 * @param resource the resource to {@link prepareWith}
	 * @param fn to wrap
	 * @returns a function which will ensure all scope values used will be prepared before use
	 */
	public prepareWrap<Args extends unknown[], Ret extends unknown, Fn extends (name: ScopeValueName, ...args: Args) => Ret>(
		this: this,
		resource: Resource,
		fn: Fn,
		thisArg?: unknown,
	): (name: ScopeValueName, ...args: Args) => Ret {
		return (name, ...args) => {
			this.prepareWith(name, resource);
			if (thisArg == undefined) {
				return fn(name, ...args);
			}

			return fn.call(thisArg, name, ...args);
		}
	}
}
