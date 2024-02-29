import type { ValueOf } from './util';
import { Dependencies } from './deps';
import { describe, expect, it } from 'vitest';

describe(Dependencies, () => {
	it('builds graphs', () => {
		const graph = new Dependencies();

		const data = {
			a: { dependsOn: ['b', 'c'], dependedOnBy: [] },
			b: { dependsOn: ['c'], dependedOnBy: ['a'] },
			c: { dependsOn: [], dependedOnBy: ['a', 'b'] },
		}


		function expectation([k, { dependedOnBy, dependsOn }]: [string, ValueOf<typeof data>]) {
			expect(graph.get(k)).to.have.deep.include({
				dependedOnBy: new Set(dependedOnBy),
				dependsOn: new Set(dependsOn),
			});
		};

		Object.entries(data).forEach(([k, { dependsOn }]) => graph.add(k, dependsOn));
		Object.entries(data).forEach(expectation);
	});
});
