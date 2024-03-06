import { beforeEach, describe, expect, it, test } from 'vitest';
import { Scope, UnpreparedError, UnpreparedValue } from './scope';
import { randomString } from './util/rand.test';

describe(Scope, () => {
	const a = randomString();
	const b = randomString();
	const c = randomString();
	const d = randomString();
	const names = [a, b, c, d];

	function setup(): Scope<number> {
		const scope = new Scope<number>();

		beforeEach(() => {
			scope.set(a, v => v + 2);
			scope.setTo(Math.random(), b);
			scope.setWith([a, b], c, async (v, inject) => ((await inject(a)).type('number') + (await inject(b)).type('number')) * v);
			scope.setAlias(d, b);

			return () => scope.clear();
		});

		return scope;
	}

	describe('set, setAlias, setWith, setTo', () => {
		const scope = setup();

		describe('stores values lazily', () => {
			test.each(names)('name %#', name => {
				const value = scope['values'].get(name);
				expect(value).to.not.have.property('cached');
				expect(value).to.have.property('fn').that.is.a('function');
				expect(value).to.have.property('prepared').that.is.false;
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

	describe('setAlias', () => {
		const scope = setup();

		it('aliases values', async () => {
			const inject = scope['inject'];
			const resource = 3;

			const { fn: aFn } = scope['values'].get(a) as UnpreparedValue<number>;
			const aValue = aFn(resource, inject);
			scope['values'].set(a, { prepared: true, cached: aValue });

			const { fn: bFn } = scope['values'].get(b) as UnpreparedValue<number>;
			const bValue = bFn(resource, inject);
			scope['values'].set(b, { prepared: true, cached: bValue });

			const { fn: dFn } = scope['values'].get(d) as UnpreparedValue<number>;
			const dValue = await dFn(resource, inject);

			expect(dValue).to.eql(bValue);
		});
	});

	describe(Scope.prototype.prepare, () => {
		const scope = setup();
		const { prepare, setWith } = scope;

		describe('caches preparation', () => {
			it.each(names.toReversed())('of %s', async name => {
				await prepare(name, Math.random());
				const value = scope['values'].get(name);
				expect(value).does.not.have.property('fn');
				expect(value).has.property('cached');
				expect(value).has.property('prepared').that.is.true;
			});
		});

		describe('throws', () => {
			it('when injecting undeclared values', async () => {
				const f = randomString();
				const g = setWith([f], randomString(), async (_, inject) => (await inject(d)).value);
				await expect(() => prepare(g, Math.random())).rejects.toThrow(ReferenceError);
			});

			it('when omitting values from dep list', async () => {
				const e = setWith([], randomString(), async (_, inject) => (await inject(a)).value);
				await expect(() => prepare(e, Math.random())).rejects.toThrow(UnpreparedError);
			});
		});
	});

	describe.each(names.toReversed())(`inject %s`, name => {
		const { prepareInjector } = setup();
		const inject = prepareInjector(Math.random());

		it('prepares and injects values', async () => {
			const injection = await inject(name);
			expect(injection).to.have.property('value').that.is.a('number');
		});
	});
});
