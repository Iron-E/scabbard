/**
 * Undo {@link Required}.
 * @see https://github.com/microsoft/TypeScript/issues/24509
 */
export type Mut<T> = {
  -readonly [key in keyof T]: T[key];
};
