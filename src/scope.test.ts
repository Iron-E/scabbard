import { beforeEach, describe, expect, it, test } from 'vitest';
import { DuplicateValueError, Scope, UnpreparedError } from './scope';
import { randomString } from './util/rand.test';

describe(Scope, () => {
	const [a, b, c] = [randomString(), randomString(), randomString()];
	const names = [a, b, c];

	function setup(): [Scope<number>, ReturnType<Scope<number>['export']>] {
		const scope = new Scope<number>();
		const { declare, inject } = scope.export();

		beforeEach(() => {
			declare(a, v => v + 2);
			declare(b, [a], v => inject(a).number * v);
			declare(c, [b], v => (inject(b).number + v).toString());

			return () => scope.clear();
		});

		return [scope, { declare, inject }];
	}

	describe('declare', () => {
		const [scope, { declare }] = setup();

		it('disallows duplicate value names', () => {
			expect(() => declare(a, () => {})).to.throw(DuplicateValueError);
		});

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

	describe.each(names.toReversed())(`${Scope.prototype.prepare.name} %s`, name => {
		const [scope, _] = setup();
		beforeEach(() => scope.prepare(name, Math.random()));

		it('caches preparation', () => {
			const value = scope['values'].get(name);
			expect(value).does.not.have.property('fn');
			expect(value).has.property('cached');
			expect(value).has.property('prepared').that.is.true;
		});
	});

	describe(Scope.prototype.prepareAll, () => {
		const [scope, _] = setup();
		beforeEach(() => scope.prepareAll(Math.random()));

		test.each(names.toReversed())('has prepared %#', name => {
			const value = scope['values'].get(name);
			expect(value).does.not.have.property('fn');
			expect(value).has.property('cached');
			expect(value).has.property('prepared').that.is.true;
		});
	});

	describe.each(names.toReversed())(`inject %s`, name => {
		const [scope, { inject }] = setup();

		it('fails when unprepared', () => {
			expect(() => inject(name)).to.throw(UnpreparedError);
		});

		it('succeeds when prepared', () => {
			scope.prepare(name, Math.random());
			const injection = inject(name);
			const ty = name === c ? 'string' : 'number';
			expect(injection).to.have.property(ty).that.is.a(ty);
		});
	});
});
