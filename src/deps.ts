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
	 * @param dependencies the dependencies `name` depends on
	 */
	public add(this: this, name: DepName, dependencies: readonly DepName[]): void {
		const dependingOn = this.getOrInit(name);

		for (const dependency of dependencies) {
			const dependedOn = this.getOrInit(dependency);

			dependingOn.dependsOn.add(dependency);
			dependedOn.dependedOnBy.add(name);
		}

		const dependingTransitivelyOn = this.get(name, true);
		if (dependingTransitivelyOn.dependedOnBy.has(name) || dependingTransitivelyOn.dependsOn.has(name)) {
			throw new DependencyCycleError('foo', name);
		}
	}

	/**
	 * @param name the {@link DepName | name} of the {@link Dependency} to get.
	 * @param [transitive=false] whether to include transitive dependencies at the top-level
	 * @returns the existing {@link Dependency}, or a new one if it did not exist.
	 */
	public get(this: this, name: DepName, transitive: boolean = false): Dep {
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
	private getTransitive<K extends keyof Dep>(this: this, dep: Dep, kind: K, visited: Dep<true>[K] = new Set()): Dep<true>[K] {
		for (const d of dep[kind]) {
			const hadSeen = visited.has(d);
			visited.add(d);
			if (!hadSeen) { // new dependency, recurse
				const subDep = this.getOrInit(d);
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
		let dep = this.deps[name]
		if (dep === undefined) {
			this.deps[name] = dep = { dependsOn: new Set(), dependedOnBy: new Set() };
		}

		return dep;
	}
}
