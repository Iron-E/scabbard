import type { EntriesOf, TheTypeOf, TypeOf } from '../util';
import { describe, expect, it, test } from 'vitest';
import { Injection, TypeInjectError } from './injection';
import { randomBigInt, randomBoolean, randomString, randomSymbol } from '../util/rand.test';

describe(Injection, () => {
	describe(Injection.prototype.check, () => {
		const injection = new Injection(Math.random());
		it('narrows types', () => {
			const three = injection.check((v): v is number => typeof v === 'number' && v === injection.value);
			expect(three).to.be.a('number').that.equals(injection.value);
		});

		it('throws when typecheck fails', () => {
			expect(() => injection.check((v): v is object => typeof v === 'object')).to.throw(TypeInjectError);
		});
	});

	describe(Injection.prototype.instance, () => {
		const injection = new Injection(new Map());
		it('narrows types', () => {
			const three = injection.instance(Map);
			expect(three).to.be.an.instanceof(Map).that.equals(injection.value);
		});

		it('throws when instanceof fails', () => {
			expect(() => injection.instance(Set)).to.throw(TypeInjectError);
		});
	});

	describe(Injection.prototype.type, () => {
		const injection = new Injection(Math.random());

		it('narrows types', () => {
			const three = injection.type('number');
			expect(three).to.be.a('number').that.equals(injection.value);
		});

		it('throws when instanceof fails', () => {
			expect(() => injection.type('boolean')).to.throw(TypeInjectError);
		});

	});

	const tests: EntriesOf<{ [key in TypeOf]: [TheTypeOf<key>, Exclude<TheTypeOf, TheTypeOf<key>>]; }>[] = [
		// @ts-ignore
		['bigint', [randomBigInt(), Math.random()]],
		['boolean', [randomBoolean(), Math.random()]],
		['function', [() => {}, Math.random()]],
		['number', [Math.random(), randomString()]],
		['object', [{}, Math.random()]],
		['string', [randomString(), Math.random()]],
		['symbol', [randomSymbol(), Math.random()]],
		['undefined', [undefined, Math.random()]],
	];

	describe('getters', () => {
		describe.each(tests)('%s', (ty, [work, fail]) => {
			test(`"narrows ${String(work)} to ${ty}"`, () => {
				const injection = new Injection(work);
				expect(injection[ty])
				.to.be.a(ty).that.eqls(work)
				.to.eql(injection.value)
				;
			});

			test(`"throws given ${String(fail)}"`, () => {
				const injection = new Injection(fail);
				expect(() => injection[ty]).to.throw(TypeInjectError);
			});
		});
	});
});
