import type { InstanceOf } from "./instance-of";

/** Used to assert that a type is constructable. */
export type Constructor<T> =
	T extends abstract new (...args: any) => InstanceOf<T>
	? T
	: never
	;
