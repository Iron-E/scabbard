const __ty = typeof 'a';

/** The potential results of `typeof` */
export type TypeOf = typeof __ty;

export type TheTypeOf<T extends TypeOf = TypeOf> =
	T extends 'bigint' ? bigint :
	T extends 'boolean' ? boolean :
	T extends 'function' ? Function :
	T extends 'number' ? number :
	T extends 'object' ? object :
	T extends 'string' ? string :
	T extends 'symbol' ? symbol :
	T extends 'undefined' ? undefined :
	never
	;
