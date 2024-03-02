/** An instance of `T` */
export type InstanceOf<T> = T extends abstract new (...args: unknown[]) => infer R ? R : never;
