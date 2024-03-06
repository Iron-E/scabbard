import { beforeEach, describe, expect, it, test } from 'vitest';
import { Scope, type PreparedValue, type UnpreparedValue, UnpreparedError } from './scope';

describe(Scope, () => {
	const a = Math.random();
	const b = Math.random();
	const c = Math.random();
	const d = Math.random();
	const k = Math.random();
	const j = Math.random();
	const names = [a, b, c, d, k, j];

	function setup(): Scope<number> {
		const scope = new Scope<number>();

		beforeEach(() => {
			scope.set(v => v + 2, a);
			scope.setTo(Math.random(), b);
			scope.setWith([a, b], async (v, inject) => (inject(a).type('number') + inject(b).type('number')) * v, c);
			scope.setAlias(b, d);
			scope.setCopy(d, k);
			scope.setCopy(d, j);
			scope.setOver(j, (v, oldValue) => oldValue.type('number') + v);

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

		async function manuallyResolveValueNamedK() {
			const inject = scope['inject'];
			const resource = Math.random();

			const { fn: aFn } = scope['values'].get(a) as UnpreparedValue<number>;
			const aValue = aFn(resource, inject);
			scope['values'].set(a, { prepared: true, cached: aValue });

			const { cached: bValue } = scope['values'].get(b) as PreparedValue<number>;

			const { fn: dFn } = scope['values'].get(d) as UnpreparedValue<number>;
			const dValue = await dFn(resource, inject);
			scope['values'].set(d, { prepared: true, cached: dValue });

			const { fn: kFn } = scope['values'].get(k) as UnpreparedValue<number>;
			const kValue = await kFn(resource, inject);
			scope['values'].set(k, { prepared: true, cached: kValue });

			return { aValue, bValue, dValue, kValue };
		}

		describe('setAlias', () => {
			beforeEach(() => {
				scope.setTo(Math.random(), b);
			});

			it('follows updates in original', async () => {
				const { bValue, dValue } = await manuallyResolveValueNamedK();
				expect(dValue).to.eql(bValue);
			});

			it('unaliases when written to', async () => {
				scope.set(Math.random.bind(Math), d);
				const { bValue, dValue } = await manuallyResolveValueNamedK();
				expect(dValue).not.to.eql(bValue);
			});
		});

		describe('set{Alias,Copy}', () => {
			it('mirrors values', async () => {
				const { bValue, dValue, kValue } = await manuallyResolveValueNamedK();

				expect(kValue)
					.to.eql(dValue)
					.to.eql(bValue)
					;
			});
		});

		describe('set{,Alias,Copy,Over,With}', () => {
			describe('stores lazily', () => {
				test.each(names.filter(n => n !== b))('value named %s', name => {
					const value = scope['values'].get(name);
					expect(value).to.not.have.property('cached');
					expect(value).to.have.property('fn').that.is.a('function');
					expect(value).to.have.property('prepared').that.is.false;
				});
			});
		});

		describe('setCopy', () => {
			beforeEach(() => {
				scope.set(Math.random.bind(Math), d);
			});

			it('does not follow updates in original', async () => {
				const { kValue, dValue } = await manuallyResolveValueNamedK();
				expect(kValue).not.to.eql(dValue);
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
