import type { ValueOf } from "./value-of";

/** Convert object to union */
export type EntriesOf<T> = ValueOf<ValueOf<{
  [key in keyof T]: { [k in key]: [k, T[k]] };
}>>;
