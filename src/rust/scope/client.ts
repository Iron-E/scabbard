import '../cache';
import { BASE_DEPENDENCIES } from '../container';
import { declare, derive } from '../../pipelines';
import { ignoreFile } from '../../std_scope/fs';
import { project } from '../../std_scope/client';
import { type Client, CacheVolume, Container, Directory } from '@dagger.io/dagger';

const prefix = '__scabbardRustClient' as const;

/**
 * The {@link Client} with {@link Client.cargoHomeCache}
 * @returns {@link CacheVolume}
 * @see {@link Client.cargoHomeCache}
 */
export const cargoHomeCache = declare(`${prefix}CargoHomeCache`, client => client.cargoHomeCache());

/**
 * @returns string the base image used for Rust containers
 */
export const baseImageName = declare(`${prefix}BaseImageName`, _ => 'rust:alpine');

/**
 * @param {@link baseImageName} the image name
 * @param {@link cargoHomeCache} the cargo cache
 * @returns {@link Container} the {@link Client} with `rust:alpine` as a base image, and with the base dependencies.
 */
export const baseContainer = derive([baseImageName, cargoHomeCache], `${prefix}base`, (client, inject) =>
	client
		.container()
		.pipeline('install deps')
		.fromWithDeps(inject(baseImageName).type('string'), BASE_DEPENDENCIES)
		.pipeline('mount cargo cache')
		.withCargoHome(inject(cargoHomeCache).instance(CacheVolume)),
);

/**
 * @param {@link baseContainer} the base container
 * @param {@link ignoreFile} the excluded
 * @returns {@link Container} the {@link Client} with a bare container having mounted the {@link project}
 */
export const withProject = derive([baseContainer, ignoreFile], `${prefix}base`, (_, inject) =>
	inject(baseContainer)
		.instance(Container)
		.pipeline('copy project directory')
		.withWorkDirectory(inject(project).instance(Directory), {
			exclude: inject(ignoreFile).optional.check((v): v is string[] => {
				return v instanceof Array && typeof v[0] === 'string';
			})
		})
);

/**
 * @param {@link withProject} the container to install cargo hack on
 * @returns {@link Container} the {@link withProject | project container} with `cargo hack`
 */
export const withCargoHack = derive([withProject], `${prefix}CargoHack`, (_, inject) =>
	inject(withProject)
		.instance(Container)
		.pipeline('install cargo-hack')
		.withCargoInstall('cargo-hack@0.6.20')
);
