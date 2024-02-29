import type { CargoCacheVolumes } from './cache';
import type { Dict } from '../util';
import { Container } from '@dagger.io/dagger';

export type ContainerWithCargoCacheOpts = Dict<'mountPoint', string>;
export type ContainerWithCargoInstallOpts =
	& Dict<'features', readonly string[]>
	& Dict<'defaultFeatures', boolean>
	;

/** base dependencies for working with rust projects */
export const BASE_DEPENDENCIES = ["clang", "file", "gcc", "git", "lld", "musl-dev", "openssl", "openssl-dev"] as const;

export const CARGO_CACHE_MOUNT_POINT = '/usr/local/cargo/.ci_cache' as const;

declare module '@dagger.io/dagger' {
	interface Container {
		/**
		 * @param volumes the cache volumes.
		 * @param mountPoint the root dir where the caches are mounted. Defaults to {@link CARGO_CACHE_MOUNT_POINT}
		 * @returns the container with the cargo cache volumes mounted
		 * @see {@link Client.cargoCacheVolumes}
		 * @see {@link Container.withMountedCache}
		 */
		withCargoCache(
			this: Readonly<this>,
			volumes: CargoCacheVolumes,
			opts?: ContainerWithCargoCacheOpts,
		): this;

		/**
		 * @param crate from {@link crates.io}.
		 * @param features to enable in the create. Comma separated. Defaults to no features.
		 * @param defaultFeatures to use default features or not. Defaults to `true`
		 * @returns the container with the `path` available as the current working `directory`.
		 * @see `cargo install --help`
		 */
		withCargoInstall(
			this: Readonly<this>,
			crate: string,
			opts?: ContainerWithCargoInstallOpts,
		): this;
	}
}

Container.prototype.withCargoCache = function(
	this: Container,
	volumes: CargoCacheVolumes,
	{ mountPoint = CARGO_CACHE_MOUNT_POINT }: ContainerWithCargoCacheOpts = {},
): Container {
	return this
		.withEnvVariable('CARGO_HOME', mountPoint)
		.withMountedCache(`${mountPoint}/bin`, volumes.bin)
		.withMountedCache(`${mountPoint}/git/db`, volumes.git.db)
		.withMountedCache(`${mountPoint}/registry/`, volumes.registry);
};

Container.prototype.withCargoInstall = function(
	this: Container,
	crate: string,
	{ features = [], defaultFeatures = true }: ContainerWithCargoInstallOpts = {},
): Container {
	const installArgs = ['cargo', 'install', crate, '--features', features.join(',')];
	if (!defaultFeatures) {
		installArgs.push('--no-default-features');
	}

	return this.withExec(installArgs);
};
