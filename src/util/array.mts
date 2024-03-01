type AsyncIter<T> = {
	[Symbol.asyncIterator](): AsyncIterator<T>,
};

declare global {
	interface ArrayConstructor {
		/**
		 * @param path the {@link import.meta.url}
		 * @returns the array collected from the promises
		 * ```
		 */
		fromAsync<T>(this: this, arrayLike: AsyncIter<T>): Promise<Array<T>>;
	}

	interface Array<T> {
		/**
		 * @returns `true` if the array has no elements
		 */
		isEmpty(this: this): boolean;
	}
}

if (!('fromAsync' in Array)) {
	async function fromAsync<T>(this: ArrayConstructor, arrayLike: AsyncIter<T>): Promise<Array<T>> {
		const array: T[] = [];
		for await (const value of arrayLike) {
			array.push(value);
		}

		return array;
	}

	(Array as ArrayConstructor).fromAsync = fromAsync;
}

Array.prototype.isEmpty = function<T>(this: T[]): boolean {
	return this.length > 0;
}
