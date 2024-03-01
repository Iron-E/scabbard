import type { FieldName } from "./util";

export class Provider<T = unknown> {
	constructor(private readonly state: Record<FieldName, T>) { }

	public injector(this: this) {
	}

	public prepare(this: this) {
	}

	public provide(this: this) {
	}
}
