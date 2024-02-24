import { pathToFileURL } from 'url';

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
export function main(path: string): boolean {
	const arg = process.argv.at(1);
	return arg !== undefined && path === pathToFileURL(arg).href;
}
