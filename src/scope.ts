import type {
	AsyncInjectFn,
	DeclareFn,
	DeclareOverFn,
	DeriveFn,
	InjectFn,
	PreparedValue,
	ScopeValue,
	ScopeValueName,
	UnpreparedValue,
} from './scope/value';
import { Injection, TypeInjectError } from './scope/injection';
import { DependencyTree } from './dependencies';
import { UnpreparedError } from './scope/unprepared-error';

export type { AsyncInjectFn, InjectFn, PreparedValue, ScopeValue, ScopeValueName, UnpreparedValue };
export { Injection, TypeInjectError, UnpreparedError };

type SetFn<Resource = unknown> = {
	/**
	 * @param valueFn how to define the value
	 * @param name of the value
	 * @returns `name`
	 */
	<T extends ScopeValueName = ScopeValueName>(valueFn: DeclareFn<Resource>, name: T): T;

	/**
	 * @param valueFn how to define the value
	 * @returns a unique name for this scope value
	 */
	(valueFn: DeclareFn<Resource>): ScopeValueName;
};

type SetAliasFn = {
	/**
	 * @param of the name `name` is aliased to
	 * @param name of the alias
	 * @returns `name`
	 */
	<T extends ScopeValueName = ScopeValueName>(of: ScopeValueName, name: T): T;

	/**
	 * @param of the name `name` is aliased to
	 * @returns a unique name
	 */
	(of: ScopeValueName): ScopeValueName;
};

type SetCopyFn = {
	/**
	 * @param of the value name being copied form
	 * @param name of the output value
	 * @returns `name`
	 */
	<T extends ScopeValueName = ScopeValueName>(of: ScopeValueName, name: T): T;

	/**
	 * @param of the value name being copied form
	 * @returns a unique name
	 */
	(of: ScopeValueName): ScopeValueName;
};

type SetToFn = {
	/**
	 * @param value the value to set `name` to
	 * @param name of the value
	 * @returns `name`
	 */
	<T extends ScopeValueName = ScopeValueName>(value: unknown, name: T): T;

	/**
	 * @param value the value to set `name` to
	 * @returns a unique name
	 */
	(value: unknown): ScopeValueName;
};

type SetWithFn<Resource = unknown> = {
	/**
	 * @param from the values which must be available before setting this value
	 * @param valueFn how `name` will be defined when the resource becomes available
	 * @param name of the value
	 * @returns `name`
	 */
	<T extends ScopeValueName>(from: Iterable<ScopeValueName>, valueFn: DeriveFn<Resource>, name: T): T;

	/**
	 * @param from the values which must be available before setting this value
	 * @param valueFn how to define this value when the resource becomes available
	 * @returns a unique name for this scope value
	 */
	(from: Iterable<ScopeValueName>, valueFn: DeriveFn<Resource>): ScopeValueName;
};

/**
 * A mechanism to {@link declare | provide} in terms of a {@link Resource}, so that once it becomes available the values can be {@link inject}ed into lexical scopes.
 */
export class Scope<Resource = unknown> {
	public constructor() { }

	/** The dependencies between {@link values} */
	private readonly dependencyTree = new DependencyTree();

	/** That which can be {@link inject}ed by the scope */
	private readonly values = new Map<ScopeValueName, ScopeValue<Resource>>();

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
	 * An implementation of {@link InjectFn} that requires values to be prepared *before* they are requested
	 *
	 * @remarks
	 * This is a property of {@link Scope}, not a method, because {@link prepare} would need to {@link Function.prototype.bind | bind} it anyway.
	 */
	private readonly inject: InjectFn = name => {
		const value = this.indexPreparedValues(name);
		return new Injection(value.cached, true);
	};

	/**
	 * @param name the value to prepare
	 * @param resource the resource to provide the scope
	 * @throws {@link ReferenceError} when `name` (or one of its dependencies) was not {@link declare}d
	 * @throws {@link TypeError} when preparation is required but no values become prepared
	 * @throws {@link UnpreparedError} when attempting to access unprepared values inside a {@link DeriveFn}
	 * @see {@link declare}
	 */
	public async prepare(this: this, name: ScopeValueName, resource: Resource): Promise<PreparedValue> {
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

			const cached = await value.fn(resource, this.inject);
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
	public prepareInjector(this: this, resource: Resource): AsyncInjectFn {
		return async name => {
			const value = await this.prepare(name, resource);
			return new Injection(value.cached, true);
		}
	};

	/**
	 * Define what value will be given to `name` when the {@link Resource} is {@link prepare | provided}.
	 *
	 * @remarks
	 * This is a property of {@link Scope}, not a method, because it is meant to be exposed to others without need of `thisArg` binding.
	 */
	public readonly set: SetFn<Resource> = (valueFn: DeclareFn<Resource>, name: ScopeValueName = this.uniqueName()) => {
		this.values.set(name, { prepared: false, fn: valueFn });
		return name;
	};

	/**
	 * Give a {@link ScopeValueName} another name.
	 * WARN: this is a one way alias. Updating this value will not update the old one.
	 *
	 * @remarks
	 * This is a property of {@link Scope}, not a method, because it is meant to be exposed to others without need of `thisArg` binding.
	 */
	public readonly setAlias: SetAliasFn = (of: ScopeValueName, name: ScopeValueName = this.uniqueName()) => {
		return this.setWith([of], (_, inject) => inject(of).value, name);
	}

	/**
	 * Give a {@link ScopeValueName} another name.
	 * WARN: may copy a {@link setAlias}, in which case copied values may be updated unexpectedly!
	 *
	 * @remarks
	 * This is a property of {@link Scope}, not a method, because it is meant to be exposed to others without need of `thisArg` binding.
	 */
	public readonly setCopy: SetCopyFn = (of: ScopeValueName, name: ScopeValueName = this.uniqueName()) => {
		const value = this.indexValues(of);
		if (value.prepared) {
			return this.setTo(value.cached, name);
		}

		const dependencies = this.dependencyTree.get(of);
		if (dependencies === undefined || dependencies.size === 0) {
			return this.set(value.fn as DeclareFn<Resource>, name);
		}

		return this.setWith(dependencies, value.fn, name);
	}

	/**
	 * @param name of the value overwritten
	 * @param as the new definition of the value
	 */
	public readonly setOver = (name: ScopeValueName, as: DeclareOverFn<Resource>): void => {
		const value = this.indexValues(name);
		if (value.prepared) {
			this.set(this.wrapOverDeclareFn(as, value.cached), name);
			return;
		}

		const declareFn: DeclareFn<Resource> = async resource => {
			const cached = await value.fn(resource, this.inject);
			return this.wrapOverDeclareFn(as, cached)(resource);
		};

		const dependencies = this.dependencyTree.get(name);
		if (dependencies === undefined || dependencies.size === 0) {
			this.set(declareFn, name);
		} else {
			this.setWith(dependencies, declareFn, name);
		}

	}

	/**
	 * Define what value will be given to `name` when the {@link Resource} is {@link prepare | provided}.
	 *
	 * @remarks
	 * This is a property of {@link Scope}, not a method, because it is meant to be exposed to others without need of `thisArg` binding.
	 */
	public readonly setTo: SetToFn = (value: unknown, name: ScopeValueName = this.uniqueName()) => {
		this.values.set(name, { cached: value, prepared: true });
		return name;
	}

	/**
	 * Define what value will be given to `name` when the {@link Resource} is {@link prepare | provided}.
	 *
	 * @remarks
	 * This is a property of {@link Scope}, not a method, because it is meant to be exposed to others without need of `thisArg` binding.
	 */
	public readonly setWith: SetWithFn<Resource> = (
		from: Iterable<ScopeValueName>,
		valueFn: DeriveFn<Resource>,
		name: ScopeValueName = this.uniqueName(),
	) => {
		this.dependencyTree.on(from, name);
		return this.set(valueFn as DeclareFn<Resource>, name);
	}

	/** @returns a name which will be unique until the next {@link set} operation. */
	private uniqueName(this: this): ScopeValueName {
		for (let _ = 0; _ < 1000; ++_) {
			const name = Math.random();
			if (!this.values.has(name)) {
				return name;
			}
		}

		throw new Error('Failed to generate unique name in 1000 iterations');
	}

	/**
	 * Wrap a {@link DeclareOverFn} into a {@link DeclareFn} using the `value`
	 * @param cb the function to wrap
	 * @param value the value to provide to the {@link DeclareOverFn}
	 */
	private wrapOverDeclareFn(cb: DeclareOverFn<Resource>, value: unknown): DeclareFn<Resource> {
		return resource => {
			const injection = new Injection(value, true);
			return cb(resource, injection);
		}
	}
}
