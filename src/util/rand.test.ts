import { describe, expect, it } from 'vitest';

export function randomBigInt(): bigint {
	return BigInt(Math.random() * 1e21);
}

export function randomBoolean(): boolean {
	return Math.random() <= 0.5;
}

export function randomString(): string {
	return Math.random().toString();
}

export function randomSymbol(): symbol {
	return Symbol(randomString());
}

describe.each([randomBigInt, randomString, randomSymbol])('%o', fn => {
	it('generates randomly', () => {
		expect(fn()).to.not.eql(fn());
	});
});

describe(randomBoolean, () => {
	const generations = new Set<boolean>();
	for (let _ = 0; _ < 10; ++_) {
		generations.add(randomBoolean());
	}

	it.each([true, false])('generates %s', b => {
		expect(generations).to.include(b);
	});
});
