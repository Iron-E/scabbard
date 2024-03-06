import type { DepName } from '../dependencies';
import { Awaitable } from '../util';
import type { Injection } from './injection';

export type ScopeValueName = DepName;

/**
 * Put a value from this scope into the lexical scope
 * @param name of the value to get
 * @returns the value in {@link Resource}
 * @throws {@link ReferenceError} if the `name` was not {@link defined}
 * @throws {@link UnpreparedError} if `name` was not prepared
 */
export type AsyncInjectFn = (name: ScopeValueName) => Promise<Injection>;

/**
 * Put a value from this scope into the lexical scope
 * @param name of the value to get
 * @returns the value in {@link Resource}
 * @throws {@link ReferenceError} if the `name` was not {@link defined}
 * @throws {@link UnpreparedError} if `name` was not prepared
 */
export type InjectFn = (name: ScopeValueName) => Injection;

/**
 * The function used to declare a value in a scope.
 * @param resource provided by the scope
 * @returns the value definition
 */
export type DeclareFn<Resource = unknown, T = unknown> = (resource: Resource) => Awaitable<T>;

/**
 * A function used to overwrite a value in scope.
 * @param resource provided by the scope
 * @param value the value being overwritten
 * @returns the value definition
 */
export type DeclareOverFn<Resource = unknown, T = unknown> = (resource: Resource, value: Injection) => Awaitable<T>;

/**
 * The function used to declare a value in a scope.
 * @param resource provided by the scope
 * @param inject function which can be used to take other values from the scope for derivation
 * @returns the value definition
 * @see {@link InjectFn}
 */
export type DeriveFn<Resource = unknown, T = unknown> = (resource: Resource, inject: InjectFn) => Awaitable<T>;

/**
 * A scope value which has had its value cached.
 */
export type PreparedValue<T = unknown> = Readonly<{
	prepared: true,
	cached: T,
}>;

/**
 * A scope value which has had its value cached.
 */
export type UnpreparedValue<Resource = unknown, T = unknown> = Readonly<{
	fn: DeclareFn<Resource, T> | DeriveFn<Resource, T>,
	prepared: false,
}>;

export type ScopeValue<Resource = unknown, T = unknown> = PreparedValue<T> | UnpreparedValue<Resource, T>;
