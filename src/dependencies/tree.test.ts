import type { Struct } from '../util';
import { beforeEach, describe, expect, it, test } from 'vitest';
import { DependencyCycleError, DependencyTree } from '.';

describe(DependencyTree, () => {
	function setup<T extends Struct<string, string[]>>(data: T): [DependencyTree, T] {
		const deps = new DependencyTree();
		beforeEach(() => {
			Object.entries(data).forEach(
				([k, dependsOn]) => deps.on(dependsOn, k),
			);

			return () => deps.clear();
		});

		return [deps, data];
	}

	describe(DependencyTree.prototype.get, () => {
		const [deps, _] = setup({});

		it('does not init dependencies', () => {
			const key = Math.random().toString();
			expect(deps.get(key)).to.be.undefined;
			expect(deps.names).to.be.empty.and.to.have.lengthOf(deps.size);
		});
	});

	describe(DependencyTree.prototype.on, () => {
		const [deps, data] = setup({
			a: ['b', 'c'],
			b: ['c'],
			c: [],
		});

		describe('assigns dependencies', () => {
			test.each(Object.entries(data))('%s on %o', (k, dependsOn) => {
				expect(deps.get(k)).to.eql(new Set(dependsOn));
			});
		});

		it('updates properties', () => {
			expect(deps.names).to.have.eql(Object.keys(data)).and.have.lengthOf(deps.size);
		});
	});

	describe(DependencyTree.prototype.loadOrder, () => {
		const [deps, data] = setup({
			a: ['b', 'c'],
			b: ['c', 'd', 'e'],
			c: ['e', 'd'],
			d: ['e'],
		});

		describe('detects dependency cycles', () => {
			test.each(Object.keys(data).concat('e'))('on %s', name => {
				deps.on(['a'], 'e');
				expect(() => deps.loadOrder(name)).to.throw(DependencyCycleError);
			});
		});

		describe('suggests loading in correct order', () => {
			test.each([
				['a', ['e', 'd', 'c', 'b', 'a']],
				['b', ['e', 'd', 'c', 'b']],
				['c', ['e', 'd', 'c']],
				['d', ['e', 'd']],
				['e', ['e']],
			])('%s with %o', (name, order) => {
				expect(deps.loadOrder(name)).to.eql(new Set(order));
			});
		});
	});
});