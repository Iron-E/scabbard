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
	 * @param name the {@link DepName | name} which has the {@link Dependency | Dependenc}ies.
	 * @param dependsOn the dependencies `name` depends on
	 */
	public add(this: this, name: DepName, dependsOn: readonly DepName[]): void {
		const dep = this.getOrInit(name);

		// if this dependency existed before, we must check for compatibility with new dependencies
		if (!(dep.dependsOn.isEmpty() && dep.dependedOnBy.isEmpty())) {
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

		for (const dependencyName of dependsOn) {
			dep.dependsOn.add(dependencyName);
			const dependency = this.getOrInit(dependencyName);
			dependency.dependedOnBy.add(name);
		}
	}

	/**
	 * @param name the {@link DepName | name} of the {@link Dependency} to get.
	 * @param [transitive=false] whether to include transitive dependencies at the top-level
	 * @returns the existing {@link Dependency}, or a new one if it did not exist.
	 */
	public get(this: this, name: DepName, transitive?: boolean): Dep;
	public get(this: this, name: DepName, transitive: true): Dep<true>;
	public get(this: this, name: DepName, transitive: boolean = false) {
		const dep = this.getOrInit(name);
		if (!transitive) {
			return dep;
		}

		const dependsOn = this.getTransitive(dep, 'dependsOn');
		const dependedOnBy = this.getTransitive(dep, 'dependedOnBy');

		return { dependsOn, dependedOnBy };
	}

	/**
	 * @param dep to get the deps of
	 * @param visited the seen deps. **Modified by this function**
	 */
	private getTransitive<K extends keyof Dep>(
		this: this,
		dep: Dep,
		kind: K,
		visited: Dep<true>[K] = new Set(),
	): Dep<true>[K] {
		for (const depName of dep[kind]) {
			const hadSeen = depName in visited;
			visited.add(depName);

			if (!hadSeen) { // new dependency, recurse
				const subDep = this.getOrInit(depName);
				this.getTransitive(subDep, kind, visited);
			}

		}

		return visited;
	}

	/**
		* Same as {@link getOrInit} but typed to allow mutation.
		* @see {@link getOrInit}
	*/
	private getOrInit(this: this, name: DepName): _Dep {
		let dep = this.deps[name];
		if (dep === undefined) {
			this.deps[name] = dep = { dependsOn: new Set(), dependedOnBy: new Set() };
		}

		return dep;
	}
}
