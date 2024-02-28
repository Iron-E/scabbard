declare global {
	interface String {
		/**
		 * @param path the {@link import.meta.url}
		 * @returns whether this file is being run by `node` directly
		 * @example
		 * ```typescript
		 * if (main()) {
		 *   console.log("I'm running from the command line"):
		 * }
		 * ```
		 */
		isMain(this: this): boolean
	}
}

const arg = process.argv.at(1);
String.prototype.isMain = function(this: string): boolean {
	return arg !== undefined && this === arg;
};
