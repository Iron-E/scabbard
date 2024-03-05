import { readIgnoreFile } from '..';
import { set } from '../pipelines';
import { stat } from 'node:fs/promises';

const prefix = '__scabbardFs' as const;

/**
 * The project's ignore file. Tries to find `./.dockerignore` first, and then falls back to `./.gitignore`. If neither are found, is `undefined`.
 * @returns `string[] | null`
 */
export const IGNORE_FILE = set(`${prefix}Project`, async () => {
	for (const path of ['.dockerignore', '.gitignore']) {
		try { await stat(path); } catch { continue; }
		return await Array.fromAsync(readIgnoreFile());
	}

	return;
});
