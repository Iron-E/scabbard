import { BASE_DEPENDENCIES } from '../container';
import { HOST_PROJECT_DIR, IGNORE_FILE, PROJECT_PATH } from '../../std_scope';
import { resolve, basename } from 'path';
import { set, setWith, setTo } from '../../pipelines';
import { type Client, CacheVolume, Container, Directory } from '@dagger.io/dagger';


/**
 * The {@link Client} with cargo build cache
 * @returns {@link CacheVolume}
 * @see {@link Client.cargoHomeCache}
 */
export const CARGO_BUILD_CACHE = setWith([PROJECT_PATH], (client, inject) => {
	const hostProjectDir = inject(PROJECT_PATH).type('string');
	const hostProjectDirname = basename(resolve(hostProjectDir));
	client.cacheVolume(`rust-${hostProjectDirname}`)
});

/**
 * The {@link Client} with `$CARGO_HOME` cache
 * @returns {@link CacheVolume}
 * @see {@link Client.cargoHomeCache}
 */
export const CARGO_HOME_CACHE = set(client => client.cacheVolume('cargo-home'));

/**
 * @returns `string` the base image used for Rust containers
 */
export const RUST_IMAGE_NAME = setTo('rust:alpine');

/**
 * @param {@link RUST_IMAGE_NAME} the image name
 * @param {@link CARGO_HOME_CACHE} the cargo cache
 * @returns {@link Container} the {@link Client} with `rust:alpine` as a base image, and with the base dependencies.
 */
export const RUST_CONTAINER = setWith(
	[CARGO_BUILD_CACHE, CARGO_HOME_CACHE, HOST_PROJECT_DIR, IGNORE_FILE, RUST_IMAGE_NAME],
	(client, inject) => {
		const cargoHomeCache = inject(CARGO_HOME_CACHE).instance(CacheVolume);
		const hostProjectDir = inject(HOST_PROJECT_DIR).instance(Directory);
		const ignoreFile = inject(IGNORE_FILE).optional.instance(Array<string>);

		const rustImageName = inject(RUST_IMAGE_NAME).type('string');

		return client
			.container()
			.pipeline('install deps')
			.fromWithDeps(rustImageName, BASE_DEPENDENCIES)
			.pipeline('mount cargo cache')
			.withCargoHomeCache(cargoHomeCache)
			.pipeline('copy project directory')
			.withWorkDirectory(hostProjectDir, { exclude: ignoreFile })
			;
	},
);

/**
 * The version of `cargo-hack` to install. Example: `0.6.20`
 * @returns `string | undefined`
 */
export const CARGO_HACK_VERSION = setTo(undefined);

/**
 * @param {@link CARGO_HACK_VERSION} the container to install cargo hack on
 * @param {@link WITH_PROJECT} the container to install cargo hack on
 * @returns {@link Container} the {@link WITH_PROJECT | project container} with `cargo hack`
 */
export const WITH_CARGO_HACK = setWith([CARGO_HACK_VERSION, RUST_CONTAINER], (_, inject) => {
	const cargoHackVersion = inject(CARGO_HACK_VERSION).optional.type('string');
	const rustContainer = inject(RUST_CONTAINER).instance(Container);

	return rustContainer
		.pipeline('install cargo-hack')
		.withCargoInstall('cargo-hack', { version: cargoHackVersion })
		;
});
