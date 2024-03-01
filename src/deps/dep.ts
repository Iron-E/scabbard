import type { RWSet } from "../util";

/** The name of a {@link Dependency} */
export type DepName = string;

/** What a {@link DepName} depends on. */
export type Dependencies<Mutable extends boolean = false> = RWSet<DepName, Mutable>;
