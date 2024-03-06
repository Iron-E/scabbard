import '../container';
import { Directory } from '@dagger.io/dagger'
import { IGNORE_FILE } from './fs';
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

/**
 * @param {@link BASE_CONTAINER} the base container
 * @param {@link HOST_PROJECT_DIR} the excluded fs entries
 * @param {@link IGNORE_FILE} the excluded directories
 * @returns {@link Container} the {@link Client} with a bare container having mounted the {@link HOST_PROJECT_DIR}
 */
export const PROJECT_CONTAINER = setWith([HOST_PROJECT_DIR, IGNORE_FILE], (client, inject) => {
	const hostProjectDir = inject(HOST_PROJECT_DIR).instance(Directory);
	const ignoreFile = inject(IGNORE_FILE).optional.check((v): v is string[] => {
		return v instanceof Array && typeof v[0] === 'string';
	});

	return client
		.pipeline('copy project directory')
		.withWorkDirectory(hostProjectDir, { exclude: ignoreFile })
		;
});
