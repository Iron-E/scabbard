import { beforeEach, describe, expect, it, test } from 'vitest';
import { DuplicateValueError, Scope, UnpreparedError } from './scope';
import { randomString } from './util/rand.test';
import { TypeOf } from '.';

describe(Scope, () => {
	const [a, b, c] = [randomString(), randomString(), randomString()];
	const names = [a, b, c];

	function setup(): [Scope<number>, ReturnType<Scope<number>['injector']>] {
		const scope = new Scope<number>();
		const inject = scope.injector();

		beforeEach(() => {
			scope
				.declare(a, v => v + 2)
				.declare(b, [a], v => inject(a).number * v)
				.declare(c, [b], v => (inject(b).number + v).toString())
				;

			return () => scope.clear();
		});

		return [scope, inject];
	}

	describe(Scope.prototype.declare, () => {
		const [scope, _] = setup();

		it('disallows duplicate value names', () => {
			expect(() => scope.declare(a, () => {})).to.throw(DuplicateValueError);
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

	describe.each(names.toReversed())(`${Scope.prototype.injector.name} %s`, name => {
		const [scope, inject] = setup();

		it('fails when unprepared', () => {
			expect(() => inject(name)).to.throw(UnpreparedError);
		});

		it('succeeds when prepared', () => {
			scope.prepare(name, Math.random());
			const injection = inject(name);

			let value: unknown;
			let ty: TypeOf;
			switch (name) {
				case c:
					value = injection.string;
					ty = 'string';
					break;

				default:
					value = injection.number;
					ty = 'number';
					break;
			}

			expect(value).to.be.a(ty);
		});
	});
});
