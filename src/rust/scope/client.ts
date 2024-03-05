import '../cache';
import { BASE_DEPENDENCIES } from '../container';
import { HOST_PROJECT_DIR } from '../../std_scope/client';
import { IGNORE_FILE } from '../../std_scope/fs';
import { set, setFrom, setTo } from '../../pipelines';
import { type Client, CacheVolume, Container, Directory } from '@dagger.io/dagger';

const prefix = '__scabbardRustClient' as const;

/**
 * @returns `string` the base image used for Rust containers
 */
export const BASE_IMAGE_NAME = setTo(`${prefix}BaseImageName`, 'rust:alpine');

/**
 * The {@link Client} with {@link Client.cargoHomeCache}
 * @returns {@link CacheVolume}
 * @see {@link Client.cargoHomeCache}
 */
export const CARGO_CACHE_HOME = set(`${prefix}CargoHomeCache`, client => client.cargoHomeCache());

/**
 * @param {@link BASE_IMAGE_NAME} the image name
 * @param {@link CARGO_CACHE_HOME} the cargo cache
 * @returns {@link Container} the {@link Client} with `rust:alpine` as a base image, and with the base dependencies.
 */
export const BASE_CONTAINER = setFrom([BASE_IMAGE_NAME, CARGO_CACHE_HOME], `${prefix}base`, async (client, inject) => {
	const baseImageName = (await inject(BASE_IMAGE_NAME)).type('string');
	const cargoCacheHome = (await inject(CARGO_CACHE_HOME)).instance(CacheVolume);

	return client
		.container()
		.pipeline('install deps')
		.fromWithDeps(baseImageName, BASE_DEPENDENCIES)
		.pipeline('mount cargo cache')
		.withCargoHome(cargoCacheHome)
		;
});

/**
 * @param {@link BASE_CONTAINER} the base container
 * @param {@link HOST_PROJECT_DIR} the excluded fs entries
 * @param {@link IGNORE_FILE} the excluded directories
 * @returns {@link Container} the {@link Client} with a bare container having mounted the {@link HOST_PROJECT_DIR}
 */
export const WITH_PROJECT = setFrom([BASE_CONTAINER, HOST_PROJECT_DIR, IGNORE_FILE], `${prefix}base`, async (_, inject) => {
	const baseContainer = (await inject(BASE_CONTAINER)).instance(Container);
	const hostProjectDir = (await inject(HOST_PROJECT_DIR)).instance(Directory);
	const ignoreFile = (await inject(IGNORE_FILE)).optional.check((v): v is string[] => {
		return v instanceof Array && typeof v[0] === 'string';
	});

	return baseContainer
		.pipeline('copy project directory')
		.withWorkDirectory(hostProjectDir, { exclude: ignoreFile });
});

/**
 * @param {@link WITH_PROJECT} the container to install cargo hack on
 * @returns {@link Container} the {@link WITH_PROJECT | project container} with `cargo hack`
 */
export const WITH_CARGO_HACK = setFrom([WITH_PROJECT], `${prefix}CargoHack`, async (_, inject) => {
	const withProject = (await inject(WITH_PROJECT)).instance(Container);
	return withProject
		.pipeline('install cargo-hack')
		.withCargoInstall('cargo-hack@0.6.20');
});
