import type { Struct } from './util';
import { describe, expect, it } from 'vitest';
import { Scope, type ProvideWith, type ScopeValueName } from './scope';

type Data<T> = Struct<ScopeValueName, [ScopeValueName[], ProvideWith<T>] | ProvideWith<T>>;

function setup<T>(values: Data<T>): [Scope<T>, Data<T>] {
	const provider: Scope<T> = new Scope();
	for (const [name, value] of Object.entries(values)) {
		if (value instanceof Array) {
			provider.provide(name, ...value);
		} else {
			provider.provide(name, value);
		}
	}

	return [provider, values];
}

describe(Scope, () => {
	describe(Scope.prototype.provide, () => {
		it.todo('stores dependencies', () => {
		});

		it.todo('lazily computes output', () => {});
	});

	describe(Scope.prototype.prepareWith, () => {
		it.todo('loads dependencies', () => {});

		it.todo('caches ', () => {});
	});

	describe(Scope.prototype.request, () => {
		it.todo('prepares state before injecting', () => {});

		it.todo('injects state', () => {});
	});
});
