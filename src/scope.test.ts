import { beforeEach, describe, expect, it, test } from 'vitest';
import { Scope, UnpreparedError, UnpreparedValue } from './scope';
import { randomString } from './util/rand.test';

describe(Scope, () => {
	const [a, b, c] = [randomString(), randomString(), randomString()];
	const names = [a, b, c];

	function setup(): [Scope<number>, ReturnType<Scope<number>['export']>] {
		const scope = new Scope<number>();
		const { set, setFrom, setTo } = scope.export();

		beforeEach(() => {
			set(a, v => v + 2);
			setFrom([a], b, (v, inject) => inject(a).type('number') * v);
			setTo(b, c);

			return () => scope.clear();
		});

		return [scope, { set, setFrom, setTo }];
	}

	describe('set, setFrom, setTo', () => {
		const [scope] = setup();

		describe('stores values lazily', () => {
			test.each(names)('name %#', name => {
				const value = scope['values'].get(name);
				expect(value).does.not.have.property('cached');
				expect(value).has.property('fn').that.is.a('function');
				expect(value).has.property('prepared').that.is.false;
			});
		});

		it('reflects getters', () => {
			const scope_names = Array.from(scope.names);
			expect(scope_names)
				.to.eql(names)
				.have.lengthOf(scope.size)
				;
		});

	});

	describe('setTo', () => {
		const [scope] = setup();

		it('aliases values', () => {
			const inject = scope['inject'];
			const resource = 3;

			const { fn: aFn } = scope['values'].get(a) as UnpreparedValue<number>;
			const aValue = aFn(resource, inject);
			scope['values'].set(a, { prepared: true, cached: aValue });

			const { fn: bFn } = scope['values'].get(b) as UnpreparedValue<number>;
			const bValue = bFn(resource, inject);
			scope['values'].set(b, { prepared: true, cached: bValue });

			const { fn: cFn } = scope['values'].get(c) as UnpreparedValue<number>;
			const cValue = cFn(resource, inject);

			expect(cValue).to.eql(bValue);
		});
	});

	describe(Scope.prototype.prepare, () => {
		const [scope, { setFrom: derive }] = setup();

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
				const e = derive([d], randomString(), (_, inject) => inject(d).value);
				expect(() => { scope.prepare(e, Math.random()); }).to.throw(ReferenceError);
			});

			it('when omitting values from dep list', () => {
				const e = derive([], randomString(), (_, inject) => inject(a).value);
				expect(() => { scope.prepare(e, Math.random()); }).to.throw(UnpreparedError);
			});
		});
	});

	describe.each(names.toReversed())(`inject %s`, name => {
		const [scope] = setup();
		const inject = scope.prepareInjector(Math.random());

		it('prepares and injects values', () => {
			const injection = inject(name);
			expect(injection).to.have.property('value').that.is.a('number');
		});
	});
});
