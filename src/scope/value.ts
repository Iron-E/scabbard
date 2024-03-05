import type { FieldName } from "../util";
import type { Injection } from "./injection";

/**
 * Put a value from this scope into the lexical scope
 * @param name of the value to get
 * @returns the value in {@link Scope}
 * @throws {@link ReferenceError} if the `name` was not {@link defined}
 * @throws {@link UnpreparedError} if `name` was not prepared
 */
export type InjectFn = (name: ScopeValueName) => Injection;

/**
 * The function used to declare a value in a scope.
 * @param resource provided by the scope
 * @returns the value definition for the value
 */
export type DeclareFn<Resource = unknown, T = unknown> = (resource: Resource) => T;

/**
 * The function used to declare a value in a scope.
 * @param resource provided by the scope
 * @param inject function which can be used to take other values from the scope for derivation
 * @returns the value definition for the value
 * @see {@link InjectFn}
 */
export type DeriveFn<Resource = unknown, T = unknown> = (resource: Resource, inject: InjectFn) => T;

export type PreparedValue<T = unknown> = {
	prepared: true,
	cached: T,
};

export type UnpreparedValue<Scope = unknown, T = unknown> = {
	fn: DeclareFn<Scope, T> | DeriveFn<Scope, T>,
	prepared: false,
};

export type ScopeValueName = FieldName;

export type ScopeValue<Scope = unknown, T = unknown> = PreparedValue<T> | UnpreparedValue<Scope, T>;
