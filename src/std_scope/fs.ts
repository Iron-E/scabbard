import { readIgnoreFile } from '..';
import { set } from '../pipelines';
import { stat } from 'node:fs/promises';

/**
 * The project's ignore file. Tries to find `./.dockerignore` first, and then falls back to `./.gitignore`. If neither are found, is `undefined`.
 * @returns `string[] | null`
 */
export const IGNORE_FILE = set(async () => {
	for (const path of ['.dockerignore', '.gitignore']) {
		try { await stat(path); } catch { continue; }
		return await Array.fromAsync(readIgnoreFile());
	}

	return;
});
