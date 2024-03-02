import type { Constructor, InstanceOf, UnionOf } from '../util';
import type { ProvideWith, ProvisionName, Provision, UnpreparedProvision } from './provider/provision';
import { DependencyTree } from '../dependencies';
import { DuplicateProvisionError } from './provider/duplicate-error';
import { UnpreparedError } from './provider/unprepared-error';

export type { Provision, ProvisionName, UnpreparedProvision, ProvideWith };
export { UnpreparedError };

/** Options for {@link ContextProvider.use}. */
export type UseOpts<T = unknown> = UnionOf<Readonly<{
	/** A test to see if the value is the type */
	is: (value: unknown) => value is T,

	/** A type which the value is an `instanceof` */
	Ty: Constructor<T>,
}>>

export class ContextProvider<Context = unknown> {
	constructor(
		private readonly dependencyTree: DependencyTree = new DependencyTree(),
		private readonly state: Record<ProvisionName, Provision | UnpreparedProvision<Context>> = {},
	) { }

	public provide(this: this, name: ProvisionName, with_: (context: Context) => unknown): void;
	public provide(this: this, name: ProvisionName, dependsOn: ProvisionName[], with_: (context: Context) => unknown): void;
	public provide(
		this: this,
		name: ProvisionName,
		fnOrDepends: ProvisionName[] | ProvideWith<Context>,
		with_?: ProvideWith<Context>,
	) {
		if (name in this.state) {
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

		this.state[name] = { prepared: false, fn: with_ };
	}

	public prepareWith(this: this, name: ProvisionName, value: Context): void {
		if (!(name in this.state)) {
		}
	}

	public use<T>(this: this, name: ProvisionName, opts: Extract<UseOpts<T>, { is: any }>): T;
	public use<T>(this: this, name: ProvisionName, opts: Extract<UseOpts<T>, { Ty: any }>): InstanceOf<T>;
	public use<T>(this: this, name: ProvisionName, opts: UseOpts<T>) {
		const item = this.state[name];
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
