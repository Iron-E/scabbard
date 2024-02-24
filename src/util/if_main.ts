import { pathToFileURL } from 'url';

declare global {
	interface ImportMeta {
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
		is_main(this: this): boolean
	}
}

const arg = process.argv.at(1);
globalThis.ImportMeta.prototype.is_main = function(this: ImportMeta): boolean {
	return arg !== undefined && this.url === pathToFileURL(arg).href;
};
