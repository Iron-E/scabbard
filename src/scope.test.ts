import type { Struct } from './util';
import { beforeEach, describe, expect, it } from 'vitest';
import { Scope, type ProvideWith, type ScopeValueName } from './scope';

describe(Scope, () => {
	const scope = new Scope<number>();

	beforeEach(() => {
		scope.provide('a', n => n + 2)
			.provide('b', ['a'], n => {
				const a = typeof 'a';
				const a = scope.inject('a', { Ty: number });
				return a * n
			})
			;

		return () => scope.clear();
	});

	describe(Scope.prototype.provide, () => {
		it.todo('stores dependencies', () => {});

		it.todo('lazily computes output', () => {});
	});

	describe(Scope.prototype.prepareWith, () => {
		it.todo('loads dependencies', () => {});

		it.todo('caches ', () => {});
	});

	describe(Scope.prototype.inject, () => {
		it.todo('prepares state before injecting', () => {});

		it.todo('injects state', () => {});
	});
});
