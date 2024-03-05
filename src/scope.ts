import type { ScopeValueName, ScopeValue, PreparedValue, ProvideWith, UnpreparedValue } from './scope/value';
import { DuplicateValueError } from './scope/duplicate-error';
import { Injection, TypeInjectError } from './scope/injection';
import { DependencyTree } from './dependencies';
import { UnpreparedError } from './scope/unprepared-error';

export type { PreparedValue, ProvideWith, ScopeValue, ScopeValueName, UnpreparedValue };
export { DuplicateValueError, Injection, TypeInjectError, UnpreparedError };

type ScopeExport<Resource> = {
	/**
	 * Define what value will be given to `name` when the {@link Resource} is {@link prepare | provided}.
	 * @param name of the value
	 * @param dependencies what other declarations must be {@link prepare | prepared} before this
	 * @param as_ how to define the value
	 * @throws {@link DuplicateValueError} if `name` was already defined
	 * @throws {@link TypeError} if `as_` is not given
	 */
	declare:
	& ((name: ScopeValueName, as_: (resource: Resource) => unknown) => void)
	& ((name: ScopeValueName, dependencies: ScopeValueName[], as_: (resource: Resource) => unknown) => void)
	,

	/**
	 * Put a value from this scope into the lexical scope
	 * @param name of the value to get
	 * @returns the value in {@link Scope}
	 * @throws {@link ReferenceError} if the `name` was not {@link defined}
	 * @throws {@link UnpreparedError} if `name` was not prepared
	 */
	inject: (name: ScopeValueName) => Injection,
};

/**
 * A mechanism to {@link declare | provide} in terms of a {@link Resource}, so that once it becomes available the values can be {@link inject}ed into lexical scopes.
 */
export class Scope<Resource = unknown> {
	public constructor(
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

	/** Clears the state of the scope provider. */
	public clear(this: this): void {
		this.dependencyTree.clear();
		this.values.clear();
	}

	/**
	 * @returns functions which can be used to declare scope values and inject scope values into lexical scope
	 */
	public export(): ScopeExport<Resource> {
		const declare = (name: ScopeValueName, asOrDependencies: ScopeValueName[] | ProvideWith<Resource>, as_?: ProvideWith<Resource>) => {
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

		const inject = (name: ScopeValueName) => {
			const value = this.indexPreparedValues(name);
			return new Injection(value.cached);
		};

		return { declare, inject };
	}

	/**
	 * @param name of the prepared value to get
	 * @returns the prepared value
	 * @throws {@link ReferenceError} if the `name` was not {@link defined}
	 * @throws {@link UnpreparedError} if `name` was not prepared
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
	 * @throws {@link ReferenceError} when `name` is not in the `state`
	 */
	private indexValues(this: this, name: ScopeValueName): ScopeValue<Resource> {
		const value = this.values.get(name);
		if (value === undefined) {
			throw new ReferenceError(`Attempted to prepare value ${name} before it was provided`);
		}

		return value;
	}

	/**
	 * @param resource to prepare the values with
	 * @param name the value to prepare. If `undefined`, prepare all values
	 */
	private _prepare(resource: Resource, name?: ScopeValueName): void {
		const order = name === undefined
			? this.dependencyTree.loadAllOrder()
			: this.dependencyTree.loadOrder(name)
			;

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
	 * @param name the value to prepare
	 * @param resource the resource to provide the scope
	 * @throws {@link ReferenceError} when `name` (or one of its dependencies) was not {@link declare}d
	 * @see {@link declare}
	 */
	public prepare(this: this, name: ScopeValueName, resource: Resource): void {
		if (this.indexValues(name).prepared) {
			return; // has been prepared previously
		}

		this._prepare(resource, name);
	}

	/**
	 * {@link prepare} all of the values in scope for {@link inject}ion
	 */
	public prepareAll(this: this, resource: Resource): void {
		this._prepare(resource);
	}
}
