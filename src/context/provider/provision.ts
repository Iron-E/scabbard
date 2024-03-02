import type { FieldName } from '../../util';

export type ProvideWith<Context = unknown, T = unknown> = (context: Context) => T;

export type Provision<T = unknown> = {
	prepared: true,
	value: T,
};

export type ProvisionName = FieldName;

export type UnpreparedProvision<Context = unknown, T = unknown> = {
	fn: ProvideWith<Context, T>,
	prepared: false,
};
