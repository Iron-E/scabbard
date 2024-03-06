/** A value which can be awaited */
export type Awaitable<T> = Awaited<T> | PromiseLike<T>;
