import type { Directory } from '@dagger.io/dagger'
import { setWith, setTo } from '../pipelines';

/**
 * The path on the host to the source code to mount
 * @returns `string`
 */
export const PROJECT_PATH = setTo('.');

/**
 * @param {@link PROJECT_PATH}
 * @returns {@link Directory} the project path as a directory
 */
export const HOST_PROJECT_DIR = setWith([PROJECT_PATH], (client, inject) => {
	const projectPath = inject(PROJECT_PATH).type('string');
	return client.host().directory(projectPath);
});
