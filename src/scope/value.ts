export type ProvideWith<Scope = unknown, T = unknown> = (scope: Scope) => T;

export type PreparedValue<T = unknown> = {
	prepared: true,
	cached: T,
};

export type UnpreparedValue<Scope = unknown, T = unknown> = {
	fn: ProvideWith<Scope, T>,
	prepared: false,
};

export type ScopeValue<Scope = unknown, T = unknown> = PreparedValue<T> | UnpreparedValue<Scope, T>;
