/** Convenience syntax over {@link ReadonlySet}, because variadic generics aren't in yet. */
export type RWSet<T, Mutable extends boolean = false> = Mutable extends true ? Set<T> : ReadonlySet<T>;
