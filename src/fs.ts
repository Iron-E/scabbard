import * as fs from 'node:fs';
import * as readline from 'readline';
import type { Dict, FieldName, Mut } from './util';

/** Options for {@link readIgnoreFile} */
export type ReadIgnoreFileOpts = Readonly<{
	/** enable reading from the cache, or writing to the cache for this operation */
	useCache?: boolean,
}>;

const IGNORE_FILE_COMMENT: Readonly<RegExp> = /^\s*[^#]/;
const READ_STREAM_OPTIONS = { encoding: 'utf-8' } as const;

const FILE_CACHE: Mut<Dict<FieldName, readonly string[]>> = {};

/**
 * @param path to a dockerignore or gitignore file
 * @returns each non-empty, non-comment line
 *
 * @remarks
 * Files are cached after reading. Repeated calls will simply read back the remembered information
 */
export async function* readIgnoreFile(
	path: string = ".dockerignore",
	{ useCache = true }: ReadIgnoreFileOpts = {},
): AsyncGenerator<string, void, undefined> {
	if (useCache) {
		const cached = FILE_CACHE[path];
		if (cached !== undefined) {
			return yield* cached;
		}
	}

	const lines: string[]  = [];

	const fileStream = fs.createReadStream(path, READ_STREAM_OPTIONS);
	const lineReader = readline.createInterface({ crlfDelay: Infinity, input: fileStream });
	for await (const line of lineReader) {
		if (line.length > 0 && line.search(IGNORE_FILE_COMMENT) < 0) {
			lines.push(line);
			yield line;
		}
	}

	if (useCache) {
		FILE_CACHE[path] = lines;
	}
}
