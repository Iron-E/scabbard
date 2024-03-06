import '../cache';
import { BASE_DEPENDENCIES } from '../container';
import { set, setWith, setTo } from '../../pipelines';
import { type Client, CacheVolume, Container } from '@dagger.io/dagger';
import { PROJECT_CONTAINER } from '../../std_scope';


/**
 * The {@link Client} with cargo build cache
 * @returns {@link CacheVolume}
 * @see {@link Client.cargoHomeCache}
 */
export const CARGO_BUILD_CACHE = set(client => client.cacheVolume('cargo-build'));
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
export const RUST_CONTAINER = setWith([CARGO_HOME_CACHE, PROJECT_CONTAINER, RUST_IMAGE_NAME], (_, inject) => {
	const cargoCacheHome = inject(CARGO_HOME_CACHE).instance(CacheVolume);
	const projectContainer = inject(PROJECT_CONTAINER).instance(Container);
	const rustImageName = inject(RUST_IMAGE_NAME).type('string');

	return projectContainer
		.pipeline('install deps')
		.fromWithDeps(rustImageName, BASE_DEPENDENCIES)
		.pipeline('mount cargo cache')
		.withCargoHomeCache(cargoCacheHome)
		;
});

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
