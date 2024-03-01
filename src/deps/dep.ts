import type { RWSet } from "../util";

/** The name of a {@link Dependency} */
export type DepName = string;

/** A dep - viewed as both a dependency and a dependent */
export type Dep<Mutable extends boolean = false> = Readonly<{
	/** What depends on this */
	dependsOn: RWSet<DepName, Mutable>,

	/** What this depends on */
	dependedOnBy: RWSet<DepName, Mutable>,
}>;
