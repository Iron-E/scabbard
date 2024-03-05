import type { Directory } from '@dagger.io/dagger'
import { setFrom, setTo } from '../pipelines';

const prefix = '__scabbardClient' as const;

/**
 * The path on the host to the source code to mount
 * @returns `string`
 */
export const PROJECT_PATH = setTo(`${prefix}ProjectPath`, '.');

/**
 * @param {@link PROJECT_PATH}
 * @returns {@link Directory} the project path as a directory
 */
export const HOST_PROJECT_DIR = setFrom([PROJECT_PATH], `${prefix}Project`, async (client, inject) => {
	const projectPath = (await inject(PROJECT_PATH)).type('string');
	return client.host().directory(projectPath);
});
