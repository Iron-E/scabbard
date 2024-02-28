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
