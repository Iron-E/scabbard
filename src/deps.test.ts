import './util/set';
import type { Struct } from './util';
import { DependencyCycleError } from './deps/dependency-cycle-error';
import { describe, expect, it } from 'vitest';
import { type Dep, Dependencies } from './deps';

describe(Dependencies, () => {
	type Data<K extends keyof Dep = keyof Dep> = Struct<string, Struct<K, string[]>>;

	function populate(data: Data<'dependsOn'>): Dependencies {
		return Object.entries(data).reduce(
			(deps, [k, { dependsOn }]) => deps.on(dependsOn, k),
			new Dependencies(),
		);
	}

	it('gets direct deps', () => {
		const data = {
			a: { dependsOn: ['b', 'c'], dependedOnBy: [] },
			b: { dependsOn: ['c'], dependedOnBy: ['a'] },
			c: { dependsOn: [], dependedOnBy: ['a', 'b'] },
		}

		const deps = populate(data);
		for (const [k, { dependedOnBy, dependsOn }] of Object.entries(data)) {
			expect(deps.get(k)).to.have.deep.include({
				dependedOnBy: new Set(dependedOnBy),
				dependsOn: new Set(dependsOn),
			});
		}
	});

	it('detects cyclical deps', () => {
		const deps = new Dependencies();
		deps.on(['b'], 'a')
			.on(['c'], 'b')
			.on(['d'], 'c');

		const before = structuredClone(deps);
		expect(() => deps.on(['a'], 'd')).to.throw(DependencyCycleError);
		expect(deps).to.be.eql(before, 'dependency cycles should be detected before changes are made');
	});

	it('plans load order', () => {
		const data = {
			a: { dependsOn: ['b', 'c'] },
			b: { dependsOn: ['c', 'd', 'e'] },
			c: { dependsOn: ['e', 'd'] },
			d: { dependsOn: ['e'] },
		}

		const deps = populate(data);
		const get = (k: string) => {
			const got = deps.get(k, true);
			return {
				dependsOn: Array.from(got.dependsOn),
				dependedOnBy: Array.from(got.dependedOnBy),
			};
		};

		let actual = get('a');
		expect(actual.dependedOnBy).to.eql([]);
		expect(actual.dependsOn).to.eql(['e', 'd', 'c', 'b']);

		actual = get('b');
		expect(actual.dependedOnBy).to.eql(['a']);
		expect(actual.dependsOn).to.eql(['e', 'd', 'c']);

		actual = get('c');
		expect(actual.dependedOnBy).to.eql(['b', 'a']);
		expect(actual.dependsOn).to.eql(['e', 'd']);

		actual = get('d');
		expect(actual.dependedOnBy).to.eql(['c', 'b', 'a']);
		expect(actual.dependsOn).to.eql(['e']);

		actual = get('e');
		expect(actual.dependedOnBy).to.eql(['d', 'c', 'b', 'a']);
		expect(actual.dependsOn).to.eql([]);
	});
});
