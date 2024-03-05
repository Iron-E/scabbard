import { declare } from '../pipelines';

const prefix = '__scabbardFs' as const;

/**
 * The project's ignore file. Tries to find `./.dockerignore` first, and then falls back to `./.gitignore`. If neither are found, is `undefined`.
 * @returns `string[] | null`
 */
export const ignoreFile = declare(`${prefix}Project`, _ => {
	throw Error("unimplemented");
});
