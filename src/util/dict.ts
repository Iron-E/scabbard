import type { FieldName } from "./field-name";
import type { Struct } from "./struct";

/** A {@link Readonly} {@link Partial} {@link Record} */
export type Dict<K extends FieldName, V> = Partial<Struct<K, V>>;
