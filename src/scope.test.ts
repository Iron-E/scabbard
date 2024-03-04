import { beforeEach, describe, expect, it, test } from 'vitest';
import { Scope } from './scope';
import { randomString } from './util/rand.test';

describe(Scope, () => {
	function setup(): [Scope<number>, [string, string, string], ReturnType<Scope<number>['injector']>] {
		const scope = new Scope<number>();
		const inject = scope.injector();

		const [a, b, c] = [randomString(), randomString(), randomString()];
		beforeEach(() => {
			scope
				.declare(a, v => v + 2)
				.declare(b, [a], v => inject(a).number * v)
				.declare(c, [b], v => (inject(b).number + v).toString())
				;

			return () => scope.clear();
		});

		return [scope, [a, b, c], inject];
	}

	describe(Scope.prototype.declare, () => {
		const [scope, names, _] = setup();
		it('stores values', () => {
			const scope_names = Array.from(scope.names);
			expect(scope_names)
				.to.eql(names)
				.have.lengthOf(scope.size)
				;
		});

		test.each(Array.from(scope['values'].entries()))('%s stored lazily as %o', (_, v) => {
			expect(v).has.property('prepared').that.is.false;
			expect(v).has.property('fn').that.is.a('function');
			expect(v).does.not.have.property('cached');
		});
	});

	describe.todo(Scope.prototype.prepare, () => {
		const [scope, names, _] = setup();
	});

	describe.todo(Scope.prototype.injector, () => {
		const [scope, names, _] = setup();
	});
});
