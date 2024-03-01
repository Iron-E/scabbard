import './util/set';
import type { Struct } from './util';
import { DependencyCycleError, DependencyTree } from './deps';
import { beforeEach, describe, expect, it, test } from 'vitest';

describe.sequential(DependencyTree, () => {
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

	describe(DependencyTree.prototype.on, () => {
		const [deps, data] = setup({
			a: ['b', 'c'],
			b: ['c'],
			c: [],
		});

		test.each(Object.entries(data))('%s depends on %o', (k, dependsOn) => {
			expect(deps.getOrInit(k)).to.eql(new Set(dependsOn));
		});
	});

	describe(DependencyTree.prototype.loadOrder, () => {
		const [deps, data] = setup({
			a: ['b', 'c'],
			b: ['c', 'd', 'e'],
			c: ['e', 'd'],
			d: ['e'],
		});

		test.each([...Object.keys(data), 'e'])('detects dependency cycles on %s', name => {
			deps.on(['a'], 'e');
			expect(() => deps.loadOrder(name)).to.throw(DependencyCycleError);
		});

		test.each([
			['a', ['e', 'd', 'c', 'b', 'a']],
			['b', ['e', 'd', 'c', 'b']],
			['c', ['e', 'd', 'c']],
			['d', ['e', 'd']],
			['e', ['e']],
		])('suggests loading %s in order %o', (name, order) => {
			expect(deps.loadOrder(name)).to.eql(new Set(order));
		});
	});
});
