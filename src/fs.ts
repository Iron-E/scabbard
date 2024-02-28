import * as fs from 'node:fs';
import * as readline from 'readline';

const IGNORE_FILE_COMMENT: Readonly<RegExp> = /^\s*[^#]/;
const READ_STREAM_OPTIONS = { encoding: 'utf-8' } as const;

/**
 * @param path to a dockerignore or gitignore file
 * @returns each non-empty, non-comment line
 */
export async function* readIgnoreFile(path: string = "dockerignore"): AsyncGenerator<string, void> {
	const fileStream = fs.createReadStream(path, READ_STREAM_OPTIONS);

	const lineReader = readline.createInterface({ crlfDelay: Infinity, input: fileStream });
	for await (const line of lineReader) {
		if (line.length > 0 && line.search(IGNORE_FILE_COMMENT) < 0) {
			yield line;
		}
	}
}
