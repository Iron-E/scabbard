/** An instance of `T` */
export type InstanceOf<T> = T extends abstract new (...args: any) => infer R ? R : never;
