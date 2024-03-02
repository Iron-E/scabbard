import { UnionKeys } from './union-keys';

/** Merges a union type */
export type SupersetOf<T> = Partial<{
	[key in UnionKeys<T>]: Extract<T, { [K in key]: any }>[key]
}>;
