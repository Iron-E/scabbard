import type { FieldName } from "./field-name";

/** A {@link Readonly} {@link Partial} {@link Record} */
export type Struct<K extends FieldName, V> = Readonly<Record<K, V>>;
