import type { ValueOf } from "./value-of";

/** Convert object to union */
export type UnionOf<T> = ValueOf<{
  [key in keyof T]: { [k in key]: T[k] };
}>;
