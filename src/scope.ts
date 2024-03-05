import type { DeclareFn, DeriveFn, InjectFn, PreparedValue, ScopeValue, ScopeValueName, UnpreparedValue } from './scope/value';
import { DuplicateValueError } from './scope/duplicate-error';
import { Injection, TypeInjectError } from './scope/injection';
import { DependencyTree } from './dependencies';
import { UnpreparedError } from './scope/unprepared-error';

export type { InjectFn, PreparedValue, ScopeValue, ScopeValueName, UnpreparedValue };
export { DuplicateValueError, Injection, TypeInjectError, UnpreparedError };

type ScopeExport<Resource> = {
	/**
	 * Define what value will be given to `name` when the {@link Resource} is {@link prepare | provided}.
	 * @param name of the value
	 * @param as how to define the value
	 * @returns `name`
	 * @throws {@link DuplicateValueError} if `name` was already defined
	 */
	declare: <T extends ScopeValueName>(name: T, as: DeclareFn<Resource>) => T,

	/**
	 * Define what value will be given to `name` when the {@link Resource} is {@link prepare | provided}.
	 * @param from the declarations used to {@link ScopeExport.declare | declare} this value
	 * @param name of the value being declared
	 * @param as how to define the value
	 * @returns `name`
	 * @throws {@link DuplicateValueError} if `name` was already defined
	 */
	derive: <T extends ScopeValueName>(from: ScopeValueName[], name: T, as: DeriveFn<Resource>) => T,
};

/**
 * A mechanism to {@link declare | provide} in terms of a {@link Resource}, so that once it becomes available the values can be {@link inject}ed into lexical scopes.
 */
export class Scope<Resource = unknown> {
	public constructor(
	) {
	}

	/** The dependencies between {@link values} */
	private readonly dependencyTree: DependencyTree = new DependencyTree();

	/** An implementation of {@link InjectFn} that requires values to be prepared *before* they are requested */
	private readonly inject: InjectFn = name => {
		const value = this.indexPreparedValues(name);
		return new Injection(value.cached);
	};

	/** That which can be {@link inject}ed by the scope */
	private readonly values: Map<ScopeValueName, ScopeValue<Resource>> = new Map();

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
	 * @param name the name to assert the uniqueness of
	 * @throws DuplicateValueError if the value was not unique
	 */
	private assertNameUnique(name: ScopeValueName): void {
		if (this.values.has(name)) {
			throw new DuplicateValueError(name);
		}
	}

	/**
	 * @returns functions which can be used to declare scope values and inject scope values into lexical scope
	 */
	public export(): ScopeExport<Resource> {
		const declare: ScopeExport<Resource>['declare'] = (name, as) => {
			this.assertNameUnique(name);

			this.values.set(name, { prepared: false, fn: as });
			return name;
		};

		const derive: ScopeExport<Resource>['derive'] = (from, name, as) => {
			this.assertNameUnique(name);

			this.dependencyTree.on(from, name);
			this.values.set(name, { prepared: false, fn: as });
			return name;
		}

		return { declare, derive };
	}

	/**
	 * @param name of the prepared value to get
	 * @returns the prepared value
	 * @throws {@link ReferenceError} if the `name` was not {@link defined}
	 * @throws {@link UnpreparedError} if `name` was not prepared
	 */
	private indexPreparedValues(this: this, name: ScopeValueName): PreparedValue {
		const value = this.indexValues(name);
		if (!value.prepared) {
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
	 * @param name the value to prepare
	 * @param resource the resource to provide the scope
	 * @throws {@link ReferenceError} when `name` (or one of its dependencies) was not {@link declare}d
	 * @throws {@link TypeError} when preparation is required but no values become prepared
	 * @throws {@link UnpreparedError} when attempting to access unprepared values inside a {@link DeriveFn}
	 * @see {@link declare}
	 */
	public prepare(this: this, name: ScopeValueName, resource: Resource): PreparedValue {
		{
			const value = this.indexValues(name);
			if (value.prepared) {
				return value; // has been prepared previously
			}
		}

		let ret: PreparedValue | undefined = undefined;
		const order = this.dependencyTree.loadOrder(name);
		for (const dependency of order) {
			const value = this.indexValues(dependency);
			if (value.prepared) { // has been prepared previously
				ret = value;
				continue;
			}

			const cached = value.fn(resource, this.inject);
			this.values.set(dependency, ret = { cached, prepared: true });
		}

		if (ret === undefined) {
			throw TypeError('No values were prepared');
		}

		return ret;
	}

	/**
	 * @returns an implementation of {@link InjectFn} which {@link prepare}s the resources requested of it lazily
	 */
	public prepareInjector(this: this, resource: Resource): InjectFn {
		return name => {
			const value = this.prepare(name, resource);
			return new Injection(value.cached);
		}
	}
}
