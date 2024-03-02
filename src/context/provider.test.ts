import { describe, expect, it } from 'vitest';
import { ContextProvider } from './provider';

describe(ContextProvider, () => {
	describe.todo(ContextProvider.prototype.provide, () => {
		it.todo('stores dependencies', () => {});

		it.todo('lazily computes output', () => {});
	});

	describe.todo(ContextProvider.prototype.prepareWith, () => {
		it.todo('loads dependencies', () => {});

		it.todo('caches ', () => {});
	});

	describe.todo(ContextProvider.prototype.use, () => {
		it.todo('prepares state before injecting', () => {});

		it.todo('injects state', () => {});
	});
});
