import { Dependencies } from './deps';
import { describe, expect, it } from 'vitest';

describe(Dependencies, () => {
	it('builds graphs', () => {
		const graph = new Dependencies();

		const expected = {
			a: { dependencies: ['b', 'c'], dependents: [] },
			b: { dependencies: ['c'], dependents: ['a'] },
			c: { dependencies: [], dependents: ['a', 'b'] },
		}

		graph.add('a', expected.a.dependencies);
		graph.add('b', expected.b.dependencies);

		for (const [k, v] of Object.entries(expected)) {
			expect(graph.get(k)).to.have.deep.include({
				asDependency: new Set(v.dependents),
				asDependent: new Set(v.dependencies),
			});
		}
	});
});
