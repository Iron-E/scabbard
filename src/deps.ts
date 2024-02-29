

/** The name of a {@link Dependency} */
export type DepKey = string;

/** What this depends on */
export type DepValue = ReadonlySet<DepKey>;

/** Mutable {@link DepValue}, for internal use */
type _DepValue = Set<DepKey>;

/** A dep - viewed as both a dependency and a dependent */
export type Dep<Value extends DepValue = DepValue> = Readonly<{
	/** What depends on this */
	asDependency: Value,

	/** What this depends on */
	asDependent: Value,
}>;

/** A system of connected {@link Dependency | Dependenc}ies */
export class Dependencies {
	constructor(
		private readonly byDependencies: Record<DepKey, _DepValue> = {},
		private readonly byDependents: Record<DepKey, _DepValue> = {},
	) { }

	/** The names of all dependencies registered */
	public get depNames(): string[] {
		return Object.keys(this.byDependents);
	}

	/**
	 * @param dependentName the {@link DepKey | name} which has the {@link Dependency | Dependenc}ies.
	 * @param dependencyNames the dependencies `name` depends on
	 */
	public add(this: this, dependentName: DepKey, dependencyNames: readonly DepKey[]): void {
		const dependent = this.getOrInit(dependentName);

		for (const dependencyName of dependencyNames) {
			dependent.asDependent.add(dependencyName);

			const dependency = this.getOrInit(dependencyName);
			dependency.asDependency.add(dependentName);
		}
	}

	/**
	 * @param name the {@link DepKey | name} of the {@link Dependency} to get.
	 * @param [transitive=false] whether to include transitive dependencies at the top-level
	 * @returns the existing {@link Dependency}, or a new one if it did not exist.
	 */
	public get(this: this, name: DepKey, transitive: boolean = false): Dep {
		const dep = this.getOrInit(name);
		if (!transitive) {
			return dep;
		}

		const asDependency: _DepValue = new Set();
		for (const dependency of dep.asDependency) {
			throw Error("unimplemented");
		}

		const asDependent: _DepValue = new Set();
		for (const dependent of dep.asDependent) {
			throw Error("unimplemented");
		}

		return { asDependency, asDependent };
	}

	/**
		* Same as {@link getOrInit} but typed to allow mutation.
		* @see {@link getOrInit}
	*/
	private getOrInit(this: this, name: DepKey): Dep<_DepValue> {
		let dependent = this.byDependents[name];
		if (dependent == undefined) {
			this.byDependents[name] = dependent = new Set();
		}

		let dependency = this.byDependencies[name];
		if (dependency == undefined) {
			this.byDependencies[name] = dependency = new Set();
		}

		return { asDependency: dependency, asDependent: dependent };
	}
}
