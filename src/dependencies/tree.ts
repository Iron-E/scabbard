import type { Dependencies, DepName } from './dependency';
import { DependencyCycleError } from './cycle-error';

/** Mutable version of {@link Dep} */
type _Dependencies = Dependencies<true>;

/** A system of connected {@link Dependency | Dependenc}ies */
export class DependencyTree {
	public constructor() { }

	/**
	 * The tree of dependencies.
	 * `dependencies[<DEPENDENCY_NAME>]` retrieves `<DEPENDENCY_NAME>`'s sub-dependencies.
	 */
	private readonly dependencies = new Map<DepName, _Dependencies>();

	/** The names of all dependencies registered */
	public get names(): IterableIterator<DepName> {
		return this.dependencies.keys();
	}

	/** The number of dependencies */
	public get size(): number {
		return this.dependencies.size;
	}

	/**
	 * Removes all dependencies from the tree.
	 */
	public clear(this: this): void {
		this.dependencies.clear();
	}

	/**
	 * @param name the name of the dependency to get or initialize
	 * @returns the existing dependency with `name`, if it exists, or a new one of it didn't.
	 */
	public get(this: this, name: DepName): Dependencies | undefined {
		return this.dependencies.get(name);
	}

	/**
	 * The same as {@link get} but typed to allow mutation.
	 */
	private getOrInit(this: this, name: DepName): _Dependencies {
		let subdependencies = this.dependencies.get(name);
		if (subdependencies === undefined) {
			this.dependencies.set(name, subdependencies = new Set());
		}

		return subdependencies;
	}

	/**
	 * @param name the {@link DepName | name} of the {@link Dependency} to get.
	 * @param [transitive=false] whether to include transitive dependencies. When transitive dependencies are included, they are given a valid load order
	 * @returns the existing {@link Dependency}, or a new one if it did not exist.
	 */
	public loadOrder(this: this, name: DepName): _Dependencies {
		const dep = this.getOrInit(name);
		return this.transitivelyDependsOn(name, dep);
	}

	/**
	 * @param name the {@link DepName | name} of the {@link Dependency} to get.
	 * @param [transitive=false] whether to include transitive dependencies. When transitive dependencies are included, they are given a valid load order
	 * @returns the existing {@link Dependency}, or a new one if it did not exist.
	 */
	public loadAllOrder(this: this): _Dependencies {
		let order: _Dependencies = new Set();
		for (const [dependency, subdependencies] of this.dependencies) {
			if (!order.has(dependency)) { // already loaded
				this.transitivelyDependsOn(dependency, subdependencies, order);
			}
		}

		return order;
	}

	/**
	 * @param name the {@link DepName | name} which has the {@link Dependency | Dependenc}ies.
	 * @param dependsOn the dependencies `name` depends on
	 * @returns the {@link DependencyTree} object
	 * @throws {@link DependencyCycleError} if any addition would be invalid
	 */
	public on(this: this, dependsOn: readonly DepName[], name: DepName): this {
		const dep = this.getOrInit(name);
		dependsOn.forEach(dep.add, dep);
		return this;
	}

	/**
	 * @param dependencies to get the deps of
	 * @param [loadOrder=new Set()] the order by which dependencies must load before using `dep`. Should be omitted on initial call.
	 * @param [ordering=new Set()] the previously visited deps. Used to prevent backtracking, since load order is stable. Should be omitted on initial call.
	 * @returns the load order to for all dependents of `dep`
	 */
	private transitivelyDependsOn(
		this: this,
		name: DepName,
		dependencies: Dependencies,
		loadOrder: _Dependencies = new Set(),
		ordering: _Dependencies = new Set(),
	): _Dependencies {
		ordering.add(name);
		for (const dependencyName of dependencies) {
			const dependency = this.getOrInit(dependencyName);
			if (!loadOrder.has(dependencyName)) { // new dependency, recurse
				if (ordering.has(dependencyName)) {
					throw new DependencyCycleError(name, dependencyName);
				}

				this.transitivelyDependsOn(dependencyName, dependency, loadOrder, ordering);
			}
		}

		ordering.delete(name);
		loadOrder.add(name);

		return loadOrder;
	}
}
