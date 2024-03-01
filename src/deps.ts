import './util/set';
import type { Dependencies, DepName } from './deps/dep';
import { DependencyCycleError } from "./deps/dependency-cycle-error";
import { inspect } from 'util';

export type * from './deps/dep';
export type { Dependencies, DepName };
export { DependencyCycleError };

/** Mutable version of {@link Dep} */
type _Dependencies = Dependencies<true>;

/** A system of connected {@link Dependency | Dependenc}ies */
export class DependencyTree {
	constructor(private deps: Record<DepName, _Dependencies> = {}) { }

	/** The names of all dependencies registered */
	public get names(): string[] {
		return Object.keys(this.deps);
	}

	/** The number of dependencies */
	public get size(): number {
		return this.names.length;
	}

	/** Removes all dependencies from the tree */
	public clear(this: this): void {
		this.deps = {};
	}

	/**
	 * @param name the name of the dependency to get or initialize
	 * @returns the existing dependency with `name`, if it exists, or a new one of it didn't.
	 */
	public getOrInit(this: this, name: DepName): Dependencies {
		return this.getMutOrInit(name);
	}

	/**
	 * The same as {@link getOrInit} but typed to allow mutation.
	 */
	private getMutOrInit(this: this, name: DepName): _Dependencies {
		let dep = this.deps[name];
		if (dep === undefined) {
			this.deps[name] = dep = new Set();
		}

		return dep;
	}

	/**
	 * @param name the {@link DepName | name} of the {@link Dependency} to get.
	 * @param [transitive=false] whether to include transitive dependencies. When transitive dependencies are included, they are given a valid load order
	 * @returns the existing {@link Dependency}, or a new one if it did not exist.
	 */
	public loadOrder(this: this, name: DepName): _Dependencies {
		const dep = this.getMutOrInit(name);
		return this.transitivelyDependsOn(name, dep);
	}

	/**
	 * @param name the {@link DepName | name} which has the {@link Dependency | Dependenc}ies.
	 * @param dependsOn the dependencies `name` depends on
	 * @returns the {@link DependencyTree} object
	 * @throws {@link DependencyCycleError} if any addition would be invalid
	 */
	public on(this: this, dependsOn: readonly DepName[], name: DepName): this {
		const dep = this.getMutOrInit(name);
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
			const dependency = this.getMutOrInit(dependencyName);
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
