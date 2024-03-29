import { describe, expect, it, test } from 'vitest';
import { Injection, TypeInjectError } from './injection';

describe(Injection, () => {
	describe('optional <-> required', () => {
		const value = Math.random();

		const injections = {
			optional: new Injection(value, false),
			required: new Injection(value, true),
		};

		const cases = [
			{ from: 'optional', to: 'required' },
			{ from: 'required', to: 'optional' },
		] as const;

		test.each(cases)('$from -> $to', ({ from, to }) => {
			const fromInjection = injections[from];
			const toInjection = injections[to];
			expect(fromInjection).has.property(to).that.deep.includes({ value: toInjection.value, _required: to === 'required' });
		});
	});

	describe(Injection.prototype.check, () => {
		const num = new Injection(Math.random(), true);

		it('narrows types', () => {
			const three = num.check((v): v is number => typeof v === 'number' && v === num.value);
			expect(three).to.be.a('number').that.equals(num.value);
		});

		it('optionally allows undefined', () => {
			const und = new Injection(undefined, false);
			const three = und.check((v): v is number => typeof v === 'number' && v === num.value);
			expect(three).to.be.undefined;
		});

		it('throws when typecheck fails', () => {
			expect(() => num.check((v): v is object => typeof v === 'object')).to.throw(TypeInjectError);
		});
	});

	describe(Injection.prototype.instance, () => {
		const injection = new Injection(new Map(), true);

		it('narrows types', () => {
			const three = injection.instance(Map);
			expect(three).to.be.an.instanceof(Map).that.equals(injection.value);
		});

		it('optionally allows undefined', () => {
			const und = new Injection(undefined, false);
			const three = und.instance(Array);
			expect(three).to.be.undefined;
		});

		it('throws when instanceof fails', () => {
			expect(() => injection.instance(Set)).to.throw(TypeInjectError);
		});
	});

	describe(Injection.prototype.type, () => {
		const injection = new Injection(Math.random(), true);

		it('narrows types', () => {
			const three = injection.type('number');
			expect(three).to.be.a('number').that.equals(injection.value);
		});

		it('optionally allows undefined', () => {
			const und = new Injection(undefined, false);
			const three = und.instance(Array);
			expect(three).to.be.undefined;
		});

		it('throws when instanceof fails', () => {
			expect(() => injection.type('boolean')).to.throw(TypeInjectError);
		});
	});
});
