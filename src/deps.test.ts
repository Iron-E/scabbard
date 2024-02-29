import './util/set';
import type { Struct } from './util';
import { describe, expect, it } from 'vitest';
import { type Dep, Dependencies } from './deps';


describe(Dependencies, () => {
	type Data = Struct<string, Struct<keyof Dep, string[]>>;

	function map<T extends Data = Data>(
		data: T,
		dependedOnBy: ReadonlySet<keyof T> = new Set(),
		dependsOn: ReadonlySet<keyof T> = new Set(),
	): Dep {
		const entries = Object.entries(data);

		const dependedOnBy_ = entries.filter(([k, _]) => dependedOnBy.has(k));
		const dependsOn_ = entries.filter(([k, _]) => dependsOn.has(k));

		type Entries = [keyof Dep, typeof dependedOnBy_ | typeof dependsOn_][];
		const entries_: Entries = [['dependedOnBy', dependedOnBy_], ['dependsOn', dependsOn_]];
		const depEntries = entries_.map(([kind, deps]) => [kind, new Set(
			deps.flatMap(([depName, dep]) => [depName, ...dep[kind]]),
		)]);

		return Object.fromEntries(depEntries);
	}

	function populate(data: Data): Dependencies {
		const deps = new Dependencies();
		for (const [k, { dependsOn }] of Object.entries(data)) {
			deps.add(k, dependsOn);
		}

		return deps;
	}

	it('gets deps', () => {
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

	it('gets transitive deps', () => {
		const data = {
			a: { dependsOn: ['b', 'd'], dependedOnBy: [] },
			b: { dependsOn: ['c'], dependedOnBy: ['a'] },
			c: { dependsOn: ['e', 'f'], dependedOnBy: ['b'] },
			d: { dependsOn: [], dependedOnBy: ['a'] },
			e: { dependsOn: [], dependedOnBy: ['c'] },
			f: { dependsOn: [], dependedOnBy: ['c'] },
		}

		const deps = populate(data);
		const get = (k: keyof typeof data) => deps.get(k, true);

		let actual = get('a');
		let expected = map(data, new Set(), new Set(['b', 'c', 'd', 'e', 'f']));
		expect(actual.dependsOn).to.eql(expected.dependsOn);
		expect(actual.dependedOnBy).to.eql(expected.dependedOnBy);

		actual = get('b');
		expected = map(data, new Set(['a']), new Set(['c', 'e', 'f']));
		expect(actual.dependsOn).to.eql(expected.dependsOn);
		expect(actual.dependedOnBy).to.eql(expected.dependedOnBy);
	});
});
