import type { TheTypeOf, TypeOf } from '../util';
import { describe, expect, it, test } from 'vitest';
import { Injection, TypeInjectError } from './injection';

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

	describe('getters', () => {
		describe('narrows', () => {
			const tests: { [key in TypeOf]: TheTypeOf<key>; } = {
				// @ts-ignore
				bigint: 3n,
				boolean: Math.random() <= 0.5,
				function: () => {},
				number: Math.random(),
				object: {},
				string: Math.random().toString(),
				symbol: Symbol('for testing symbol support'),
				undefined: undefined,
			};

			const each = Object.entries(tests) as [keyof typeof tests, unknown][];
			test.each(each)('`%s` given "%o"', (t, val) => {
				const injection = new Injection(val);
				expect(injection[t]).to.be.a(t).that.equals(val).and.equals(injection.value);
			});
		});

		describe('throws', () => {
			const tests: { [key in TypeOf]: Exclude<TheTypeOf, TheTypeOf<key>>; } = {
				// @ts-ignore
				bigint: Math.random(),
				boolean: Math.random(),
				function: Math.random(),
				number: Math.random.toString(),
				object: Math.random(),
				string: Math.random(),
				symbol: Math.random(),
				undefined: Math.random(),
			};

			const each = Object.entries(tests) as [keyof typeof tests, unknown][];
			test.each(each)('`%s` given "%o"', (t, val) => {
				const injection = new Injection(val);
				expect(() => injection[t]).to.throw(TypeInjectError);
			});
		});
	});
});
