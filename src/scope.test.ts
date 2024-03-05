import { beforeEach, describe, expect, it, test } from 'vitest';
import { Scope, UnpreparedError } from './scope';
import { randomString } from './util/rand.test';

describe(Scope, () => {
	const [a, b, c] = [randomString(), randomString(), randomString()];
	const names = [a, b, c];

	function setup(): [Scope<number>, ReturnType<Scope<number>['export']>] {
		const scope = new Scope<number>();
		const { declare, derive } = scope.export();

		beforeEach(() => {
			declare(a, v => v + 2);
			derive([a], b, (v, inject) => inject(a).type('number') * v);
			derive([b], c, (v, inject) => (inject(b).type('number') + v).toString());

			return () => scope.clear();
		});

		return [scope, { declare, derive }];
	}

	describe('declare', () => {
		const [scope] = setup();

		it('stores values', () => {
			const scope_names = Array.from(scope.names);
			expect(scope_names)
				.to.eql(names)
				.have.lengthOf(scope.size)
				;
		});

		test.each(Array.from(scope['values'].entries()))('%s stored lazily', (_, v) => {
			expect(v).does.not.have.property('cached');
			expect(v).has.property('fn').that.is.a('function');
			expect(v).has.property('prepared').that.is.false;
		});
	});

	describe(Scope.prototype.prepare, () => {
		const [scope, { derive }] = setup();

		describe('caches preparation', () => {
			it.each(names.toReversed())('of %s', name => {
				scope.prepare(name, Math.random());
				const value = scope['values'].get(name);
				expect(value).does.not.have.property('fn');
				expect(value).has.property('cached');
				expect(value).has.property('prepared').that.is.true;
			});
		});

		describe('throws', () => {
			it('when injecting undeclared values', () => {
				const d = randomString();
				const e = derive([d], randomString(), (_, inject) =>  inject(d).value);
				expect(() => { scope.prepare(e, Math.random()); }).to.throw(ReferenceError);
			});

			it('when omitting values from dep list', () => {
				const e = derive([], randomString(), (_, inject) =>  inject(a).value);
				expect(() => { scope.prepare(e, Math.random()); }).to.throw(UnpreparedError);
			});
		});
	});

	describe.each(names.toReversed())(`inject %s`, name => {
		const [scope] = setup();
		const inject = scope.prepareInjector(Math.random());

		it('prepares and injects values', () => {
			const injection = inject(name);
			expect(injection).to.have.property('value').that.is.a(name === c ? 'string' : 'number');
		});
	});
});
