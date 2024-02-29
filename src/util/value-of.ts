/**
 * The types of the values of `<T>`.
 *
 * @example
 * ```typescript
 * type A = ValueOf<{a: number, b: string}>; // `string | number`
 * ```
 */
export type ValueOf<T> =
	T extends T
	? NonNullable<NonNullable<T>[keyof NonNullable<T>]>
	: never
	;
