declare global {
	interface String {
		/**
		 * @param path the {@link import.meta.filename}
		 * @returns whether this file is being run by `node` directly
		 * @example
		 * ```typescript
		 * if ("foo".isMain()) {
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
