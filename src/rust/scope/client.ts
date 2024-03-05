import '../cache';
import { BASE_DEPENDENCIES } from '../container';
import { set, setFrom, setTo } from '../../pipelines';
import { ignoreFile } from '../../std_scope/fs';
import { HOST_PROJECT_DIR } from '../../std_scope/client';
import { type Client, CacheVolume, Container, Directory } from '@dagger.io/dagger';

const prefix = '__scabbardRustClient' as const;

/**
 * The {@link Client} with {@link Client.cargoHomeCache}
 * @returns {@link CacheVolume}
 * @see {@link Client.cargoHomeCache}
 */
export const CARGO_CACHE_HOME = set(`${prefix}CargoHomeCache`, client => client.cargoHomeCache());

/**
 * @returns string the base image used for Rust containers
 */
export const BASE_IMAGE_NAME = setTo(`${prefix}BaseImageName`, 'rust:alpine');

/**
 * @param {@link BASE_IMAGE_NAME} the image name
 * @param {@link CARGO_CACHE_HOME} the cargo cache
 * @returns {@link Container} the {@link Client} with `rust:alpine` as a base image, and with the base dependencies.
 */
export const baseContainer = setFrom([BASE_IMAGE_NAME, CARGO_CACHE_HOME], `${prefix}base`, (client, inject) =>
	client
		.container()
		.pipeline('install deps')
		.fromWithDeps(inject(BASE_IMAGE_NAME).type('string'), BASE_DEPENDENCIES)
		.pipeline('mount cargo cache')
		.withCargoHome(inject(CARGO_CACHE_HOME).instance(CacheVolume)),
);

/**
 * @param {@link baseContainer} the base container
 * @param {@link ignoreFile} the excluded
 * @returns {@link Container} the {@link Client} with a bare container having mounted the {@link HOST_PROJECT_DIR}
 */
export const withProject = setFrom([baseContainer, ignoreFile], `${prefix}base`, (_, inject) =>
	inject(baseContainer)
		.instance(Container)
		.pipeline('copy project directory')
		.withWorkDirectory(inject(HOST_PROJECT_DIR).instance(Directory), {
			exclude: inject(ignoreFile).optional.check((v): v is string[] => {
				return v instanceof Array && typeof v[0] === 'string';
			})
		})
);

/**
 * @param {@link withProject} the container to install cargo hack on
 * @returns {@link Container} the {@link withProject | project container} with `cargo hack`
 */
export const withCargoHack = setFrom([withProject], `${prefix}CargoHack`, (_, inject) =>
	inject(withProject)
		.instance(Container)
		.pipeline('install cargo-hack')
		.withCargoInstall('cargo-hack@0.6.20')
);
