import { beforeEach, describe, expect, it } from 'vitest';
import { Scope } from './scope';

describe(Scope, () => {
	const scope = new Scope<number>();
	const inject = scope.injector();

	beforeEach(() => {
		scope
			.declare('a', x => x + 2)
			.declare('b', ['a'], x => inject('a').type('number') * x)
			.declare('c', ['a', 'b'], _ => new Map().set('a', inject('a').number).set('b', inject('b').number))
			;

		return () => scope.clear();
	});

	describe(Scope.prototype.declare, () => {
	});

	describe(Scope.prototype.prepare, () => {
	});

	describe(Scope.prototype.injector, () => {
	});
});
