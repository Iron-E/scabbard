import './util/set';
import type { Struct } from './util';
import { DependencyCycleError, DependencyTree } from './deps';
import { describe, expect, it } from 'vitest';

describe(DependencyTree, () => {
	type Data = Struct<string, string[]>;

	function populate(data: Data): DependencyTree {
		return Object.entries(data).reduce(
			(deps, [k, dependsOn]) => deps.on(dependsOn, k),
			new DependencyTree(),
		);
	}

	it('gets direct deps', () => {
		const data = {
			a: ['b', 'c'],
			b: ['c'],
			c: [],
		}

		const deps = populate(data);
		for (const [k, dependsOn] of Object.entries(data)) {
			expect(deps.getOrInit(k)).to.eql(new Set(dependsOn));
		}
	});

	it('detects cyclical deps', () => {
		const deps = new DependencyTree();
		deps.on(['b'], 'a')
			.on(['c'], 'b')
			.on(['d'], 'c');

		const lexpect = (name: string, message?: string) => expect(() => deps.loadOrder(name), message);

		for (const name of deps.names) {
			lexpect(name, `load order resolution for "${name}" should work before cycle is introduced`).to.not.throw();
		}

		deps.on(['a'], 'd');
		for (const name of deps.names) {
			lexpect(name).to.throw(DependencyCycleError);
		}
	});

	it('resolves load order', () => {
		const data = {
			a: ['b', 'c'],
			b: ['c', 'd', 'e'],
			c: ['e', 'd'],
			d: ['e'],
		}

		const deps = populate(data);
		const gexpect = (k: string) => expect(Array.from(deps.loadOrder(k)));

		gexpect('a').to.eql(['e', 'd', 'c', 'b', 'a']);
		gexpect('b').to.eql(['e', 'd', 'c', 'b']);
		gexpect('c').to.eql(['e', 'd', 'c']);
		gexpect('d').to.eql(['e', 'd']);
		gexpect('e').to.eql(['e']);
	});
});
