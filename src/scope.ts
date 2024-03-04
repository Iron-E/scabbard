import type { ScopeValue, PreparedValue, ProvideWith, UnpreparedValue } from './scope/value';
import { DependencyTree } from './dependencies';
import { DuplicateValueError } from './scope/duplicate-error';
import { Injection, TypeInjectError, type InjectionName } from './scope/injection';
import { UnpreparedError } from './scope/unprepared-error';

export type { InjectionName, PreparedValue, ProvideWith, ScopeValue, UnpreparedValue };
export { DuplicateValueError, Injection, TypeInjectError, UnpreparedError };

/**
 * A mechanism to {@link declare | provide} in terms of a {@link Resource}, so that once it becomes available the values can be {@link inject}ed into lexical scopes.
 */
export class Scope<Resource = unknown> {
	public constructor(
		/** The dependencies between {@link values} */
		private readonly dependencyTree: DependencyTree = new DependencyTree(),

		/** That which can be {@link inject}ed by the scope */
		private readonly values: Map<InjectionName, ScopeValue<Resource>> = new Map(),
	) { }

	/** The names of all the values in scope */
	public get names(): IterableIterator<InjectionName> {
		return this.values.keys();
	}

	/** The number of values in scope */
	public get size(): number {
		return this.values.size;
	}

	/** Clears the state of the scope provider. */
	public clear(this: this): void {
		this.dependencyTree.clear();
		this.values.clear();
	}

	/**
	 * Define what value will be given to `name` when the {@link Resource} is {@link prepare | provided}.
	 * @param name of the value
	 * @param dependencies what other declarations must be {@link prepare | prepared} before this
	 * @param as_ how to define the value
	 * @throws {@link DuplicateValueError} if `name` was already defined
	 * @throws {@link TypeError} if `as_` is not given
	 */
	public declare(this: this, name: InjectionName, as_: (resource: Resource) => unknown): this;
	public declare(this: this, name: InjectionName, dependencies: InjectionName[], as_: (resource: Resource) => unknown): this;
	public declare(
		this: this,
		name: InjectionName,
		asOrDependencies: InjectionName[] | ProvideWith<Resource>,
		as_?: ProvideWith<Resource>,
	) {
		if (this.values.has(name)) {
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
	 * @throws {@link ReferenceError} if the `name` was not {@link defined}
	 * @throws {@link UnpreparedError} if `name` was not prepared
	 */
	private indexPreparedValues(this: this, name: InjectionName): PreparedValue {
		const value = this.indexValues(name);
		if (value === undefined || !value.prepared) {
			throw new UnpreparedError(name);
		}

		return value;
	}

	/**
	 * @param name the name of the value
	 * @throws {@link ReferenceError} when `name` is not in the `state`
	 */
	private indexValues(this: this, name: InjectionName): ScopeValue<Resource> {
		const value = this.values.get(name);
		if (value === undefined) {
			throw new ReferenceError(`Attempted to prepare value ${name} before it was provided`);
		}

		return value;
	}

	/** @returns a callable which will get inject values from this {@link Scope} into the lexical scope */
	public injector(this: this):
		/**
		 * @param name of the value to get
		 * @returns the value in {@link Scope}
		 * @throws {@link ReferenceError} if the `name` was not {@link defined}
		 * @throws {@link UnpreparedError} if `name` was not prepared
		 */
		(name: InjectionName) => Injection {
		return (name: InjectionName) => {
			const value = this.indexPreparedValues(name);
			return new Injection(value.cached);
		};
	}

	/**
	 * @param name the value to prepare
	 * @param resource the resource to provide the scope
	 * @throws {@link ReferenceError} when `name` (or one of its dependencies) was not {@link declare}d
	 * @see {@link declare}
	 */
	public prepare(this: this, name: InjectionName, resource: Resource): void {
		if (this.indexValues(name).prepared) {
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
}
