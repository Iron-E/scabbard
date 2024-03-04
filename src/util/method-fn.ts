/** A method wrapped in a function */
export type MethodFn<T> = T extends (this: any, ...args: infer Args) => infer Ret
	? (...args: Args) => Ret
	: never
	;
