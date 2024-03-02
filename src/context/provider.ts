import type { Constructor, InstanceOf, UnionOf } from '../util';
import type { PreparedProvision, ProvideWith, Provision, ProvisionName, UnpreparedProvision } from './provider/provision';
import { DependencyTree } from '../dependencies';
import { DuplicateProvisionError } from './provider/duplicate-error';
import { UnpreparedError } from './provider/unprepared-error';

export type { Provision, PreparedProvision, ProvideWith , ProvisionName, UnpreparedProvision};
export { UnpreparedError };

/** Options for {@link ContextProvider.request}. */
export type UseOpts<T = unknown> = UnionOf<Readonly<{
	/** A test to see if the value is the type */
	is: (value: unknown) => value is T,

	/** A type which the value is an `instanceof` */
	Ty: Constructor<T>,
}>>

export class ContextProvider<Context = unknown> {
	constructor(
		private readonly dependencyTree: DependencyTree = new DependencyTree(),
		private readonly provisions: Record<ProvisionName, Provision<Context>> = {},
	) { }

	/**
	 * @param name the name of the provision
	 * @throws ReferenceError when `name` is not in the `state`
	 */
	private indexProvisions(this: this, name: ProvisionName): Provision<Context> {
		const item = this.provisions[name];
		if (item === undefined) {
			throw new ReferenceError(`Attempted to prepare provision ${String(name)} before it was provided`);
		}

		return item;
	}

	/**
	 * Define a provision with the given `name`, that can be {@link request}ed after {@link Context} is provided.
	 * @param name of the provision
	 * @param with_ how to provide the provision
	 * @throws DuplicateProvisionError if `name` was already defined
	 * @throws TypeError if `with_` is not given
	 */
	public provide(this: this, name: ProvisionName, with_: (context: Context) => unknown): void;
	public provide(this: this, name: ProvisionName, dependsOn: ProvisionName[], with_: (context: Context) => unknown): void;
	public provide(
		this: this,
		name: ProvisionName,
		fnOrDepends: ProvisionName[] | ProvideWith<Context>,
		with_?: ProvideWith<Context>,
	) {
		if (name in this.provisions) {
			throw new DuplicateProvisionError(name);
		}

		if (typeof fnOrDepends === 'function') {
			with_ = fnOrDepends;
		} else {
			this.dependencyTree.on(fnOrDepends, name);
			if (with_ === undefined) {
				throw new TypeError('Must specify function to provide with');
			}
		}

		this.provisions[name] = { prepared: false, fn: with_ };
	}

	/**
	 * @param name the provision to prepare
	 * @param context the context of the provision
	 * @throws ReferenceError when `name` (or one of its dependencies) was not {@link provide}d
	 * @see {@link provide}
	 */
	public prepareWith(this: this, name: ProvisionName, context: Context): void {
		if (this.indexProvisions(name)) {
			return; // has been prepared previously
		}

		const order = this.dependencyTree.loadOrder(name);
		for (const dependency of order) {
			const item = this.indexProvisions(dependency);
			if (item.prepared) { // has been prepared previously
				continue;
			}

			const value = item.fn(context);
			this.provisions[dependency] = { prepared: true, value };
		}
	}

	/**
	 * @param name the identifier of the provision to use
	 * @param opts options options for the use of the provision
	 * @returns the requested provision
	 * @throws UnpreparedError if this function is called before {@link Context} is available
	 * @throws TypeError if the requested provision is not of the specified type
	 */
	public request<T>(this: this, name: ProvisionName, opts: Exclude<UseOpts<T>, { Ty: any }>): T;
	public request<T>(this: this, name: ProvisionName, opts: Exclude<UseOpts<T>, { is: any }>): InstanceOf<T>;
	public request<T>(this: this, name: ProvisionName, opts: UseOpts<T>) {
		const item = this.provisions[name];
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

		throw new TypeError(`Tried to get provision ${String(name)} as ${('is' in opts ? opts.is : opts.Ty).name}, \
but ${item} does not meet that criteria`);
	}
}
