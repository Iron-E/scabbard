import { beforeEach, describe, expect, it, test } from 'vitest';
import { Scope, type PreparedValue, type UnpreparedValue, UnpreparedError } from './scope';

describe(Scope, () => {
	const a = Math.random();
	const b = Math.random();
	const c = Math.random();
	const d = Math.random();
	const names = [a, b, c, d];

	function setup(): Scope<number> {
		const scope = new Scope<number>();

		beforeEach(() => {
			scope.set(v => v + 2, a);
			scope.setTo(Math.random(), b);
			scope.setWith([a, b], async (v, inject) => (inject(a).type('number') + inject(b).type('number')) * v, c);
			scope.setAlias(b, d);

			return () => scope.clear();
		});

		return scope;
	}

	describe('set*', () => {
		const scope = setup();

		it('reflects getters', () => {
			const scope_names = Array.from(scope.names);
			expect(scope_names)
				.to.eql(names)
				.to.have.length(scope.size)
				;
		});

		describe('setAlias', () => {
			it('aliases values', async () => {
				const inject = scope['inject'];
				const resource = 3;

				const { fn: aFn } = scope['values'].get(a) as UnpreparedValue<number>;
				const aValue = aFn(resource, inject);
				scope['values'].set(a, { prepared: true, cached: aValue });

				const { cached: bValue } = scope['values'].get(b) as PreparedValue<number>;

				const { fn: dFn } = scope['values'].get(d) as UnpreparedValue<number>;
				const dValue = await dFn(resource, inject);

				expect(dValue).to.eql(bValue);
			});
		});

		describe('set{,Alias,With}', () => {
			describe('stores lazily', () => {
				test.each(names.filter(n => n !== b))('value named %s', name => {
					const value = scope['values'].get(name);
					expect(value).to.not.have.property('cached');
					expect(value).to.have.property('fn').that.is.a('function');
					expect(value).to.have.property('prepared').that.is.false;
				});
			});
		});

		describe('setTo', () => {
			describe('eagerly sets values', () => {
				test.each(names.filter(n => n === b))('name %#', name => {
					const value = scope['values'].get(name);
					expect(value).does.not.have.property('fn');
					expect(value).has.property('cached');
					expect(value).has.property('prepared').that.is.true;
				});
			});
		});
	});

	describe('prepare', () => {
		const scope = setup();
		const { setWith } = scope;
		const prepare = scope.prepare.bind(scope);

		describe('caches preparation', () => {
			it.each(names.toReversed())('of value named %s', async name => {
				await prepare(name, Math.random());
				const value = scope['values'].get(name);
				expect(value).does.not.have.property('fn');
				expect(value).has.property('cached');
				expect(value).has.property('prepared').that.is.true;
			});
		});

		describe('throws', () => {
			it('when injecting undeclared values', async () => {
				const f = Math.random();
				const g = setWith([f], async (_, inject) => inject(d).value, Math.random());
				await expect(() => prepare(g, Math.random())).rejects.toThrow(ReferenceError);
			});

			it('when omitting values from dep list', async () => {
				const e = setWith([], async (_, inject) => inject(a).value, Math.random());
				await expect(() => prepare(e, Math.random())).rejects.toThrow(UnpreparedError);
			});
		});
	});

	describe('inject', () => {
		const scope = setup();
		const inject = scope.prepareInjector(Math.random());

		describe('prepares and provides', () => {
			test.each(names.toReversed())('value named %s', async name => {
				const injection = await inject(name);
				expect(injection).to.have.property('value').that.is.a('number');
			});
		});
	});
});
