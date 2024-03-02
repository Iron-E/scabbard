import type { FieldName } from '../../util';

export type ProvideWith<Context = unknown, T = unknown> = (context: Context) => T;

export type PreparedProvision<T = unknown> = {
	prepared: true,
	value: T,
};

export type UnpreparedProvision<Context = unknown, T = unknown> = {
	fn: ProvideWith<Context, T>,
	prepared: false,
};

export type ProvisionName = FieldName;

export type Provision<Context = unknown, T = unknown> = PreparedProvision<T> | UnpreparedProvision<Context, T>;
