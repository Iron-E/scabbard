import './util/set';
import type { Dep, DepName } from './deps/dep';
import { DependencyCycleError } from "./deps/dependency-cycle-error";

export type * from './deps/dep';
export type { Dep, DepName };
export { DependencyCycleError };

/** Mutable version of {@link Dep} */
type _Dep = Dep<true>;

/** A system of connected {@link Dependency | Dependenc}ies */
export class Dependencies {
	constructor(private readonly deps: Record<DepName, _Dep> = {}) { }

	/** The names of all dependencies registered */
	public get depNames(): string[] {
		return Object.keys(this.deps);
	}

	/**
	 * @param name the name of the `dep`
	 * @param dep the data for `name` (see {@link getOrInit})
	 * @param dependsOn the additional dependencies which would be added to `dep`
	 * @throws {@link DependencyCycleError} if any addition would be invalid
	 */
	private checkAdditionValidity(this: this, name: DepName, dep: Dep, dependsOn: readonly DepName[]): void {
		// if this dependency existed before, we must check for compatibility with new dependencies
		if ((dep.dependsOn.isEmpty() && dep.dependedOnBy.isEmpty())) {
			return;
		}

		// detecting cycles requires getting transitive dependencies
		const transitiveDeps = this.get(name, true);

		for (const dependencyName of dependsOn) {
			// PERF: don't worry about checking compatibility twice
			if (dep.dependsOn.has(dependencyName)) {
				continue;
			}

			const dependency = this.getOrInit(dependencyName);
			for (const subDependencyName of dependency.dependsOn) {
				// if a dependency has a subdependency which transitively depends on this, that is a cycle
				if (transitiveDeps.dependedOnBy.has(subDependencyName)) {
					throw new DependencyCycleError(name, dependencyName, subDependencyName);
				}
			}
		}
	}

	/**
	 * @param name the {@link DepName | name} of the {@link Dependency} to get.
	 * @param [transitive=false] whether to include transitive dependencies. When transitive dependencies are included, they are given a valid load order
	 * @returns the existing {@link Dependency}, or a new one if it did not exist.
	 */
	public get(this: this, name: DepName, transitive?: boolean): Dep;
	public get(this: this, name: DepName, transitive: true): Dep<true>;
	public get(this: this, name: DepName, transitive: boolean = false) {
		const dep = this.getOrInit(name);
		if (!transitive) {
			return dep;
		}

		const dependedOnBy = this.transitivelyDependedOnBy(dep);
		const dependsOn = this.transitivelyDependsOn(dep);
		return { dependsOn, dependedOnBy };
	}

	/**
	 * @param name the name of the dependency to get or initialize
	 * @returns the existing dependency with `name`, if it exists, or a new one of it didn't.
	 */
	private getOrInit(this: this, name: DepName): _Dep {
		let dep = this.deps[name];
		if (dep === undefined) {
			this.deps[name] = dep = { dependsOn: new Set(), dependedOnBy: new Set() };
		}

		return dep;
	}

	/**
	 * @param name the {@link DepName | name} which has the {@link Dependency | Dependenc}ies.
	 * @param dependsOn the dependencies `name` depends on
	 * @returns the {@link Dependencies} object
	 * @throws {@link DependencyCycleError} if any addition would be invalid
	 */
	public on(this: this, dependsOn: readonly DepName[], name: DepName): this {
		const dep = this.getOrInit(name);

		this.checkAdditionValidity(name, dep, dependsOn);

		for (const dependencyName of dependsOn) {
			dep.dependsOn.add(dependencyName);
			const dependency = this.getOrInit(dependencyName);
			dependency.dependedOnBy.add(name);
		}

		return this;
	}

	/**
	 * @param dep to get the deps of
	 * @param [loadOrder=new Set()] the current load order. Is unstable until finishing. Should be omitted on initial call.
	 * @returns the load order to for all dependents of `dep`
	 */
	private transitivelyDependedOnBy(
		this: this,
		dep: Dep,
		loadOrder: Dep<true>['dependedOnBy'] = new Set(),
	): Dep<true>['dependedOnBy'] {
		for (const depName of dep.dependedOnBy) {
			// NOTE: JS sets are ordered. this ensures dependencies seen later in graph traversal end up later in the set
			loadOrder.delete(depName);
			loadOrder.add(depName);

			const subDep = this.getOrInit(depName);
			this.transitivelyDependedOnBy(subDep, loadOrder);
		}

		return loadOrder;
	}

	/**
	 * @param dep to get the deps of
	 * @param [loadOrder=new Set()] the order by which dependencies must load before using `dep`. Should be omitted on initial call.
	 * @param [visited=new Set()] the previously visited deps. Used to prevent backtracking, since load order is stable. Should be omitted on initial call.
	 * @returns the load order to for all dependents of `dep`
	 */
	private transitivelyDependsOn(
		this: this,
		dep: Dep,
		loadOrder: Dep<true>['dependsOn'] = new Set(),
		visited: Dep<true>['dependsOn'] = new Set(),
	): Dep<true>['dependsOn'] {
		for (const depName of dep.dependsOn) {
			const subDep = this.getOrInit(depName);
				if (!visited.has(depName)) { // new dependency, recurse
					visited.add(depName);
					this.transitivelyDependsOn(subDep, loadOrder, visited);
				}

				loadOrder.add(depName);
		}

		return loadOrder;
	}
}
