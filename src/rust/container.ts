import type { Superset } from '../util';
import { Container, type CacheVolume } from '@dagger.io/dagger';

/** Options for {@link Container.withCargoHome} */
export type ContainerWithCargoCacheOpts = Superset<{
	/** the mount point for cargo home */
	mountPoint: string,
}>;

/** Options for {@link Container.withCargoInstall} */
export type ContainerWithCargoInstallOpts = Superset<{
	/** If `false`, use `--no-default-features` */
	defaultFeatures: boolean,

	/** The features to enable while installing */
	features: readonly string[],

	/** Use `--force` */
	force: boolean,

	/** The `--version` to install */
	version: string,
}>;

/** base dependencies for working with rust projects */
export const BASE_DEPENDENCIES = ["clang", "file", "gcc", "git", "lld", "musl-dev", "openssl", "openssl-dev"] as const;

export const CARGO_CACHE_MOUNT_POINT = '/usr/local/cargo/.ci_cache' as const;

declare module '@dagger.io/dagger' {
	interface Container {
		/**
		 * @param volumes the cache volumes.
		 * @param mountPoint the root dir where the caches are mounted. Defaults to {@link CARGO_CACHE_MOUNT_POINT}
		 * @returns the container with the cargo cache volumes mounted
		 * @see {@link Client.cargoHomeCache}
		 * @see {@link Container.withMountedCache}
		 */
		withCargoHome(this: Readonly<this>, volume: CacheVolume, opts?: ContainerWithCargoCacheOpts): this;

		/**
		 * @param crate from {@link crates.io}.
		 * @param features to enable in the create. Comma separated. Defaults to no features.
		 * @param defaultFeatures to use default features or not. Defaults to `true`
		 * @returns the container with the `path` available as the current working `directory`.
		 * @see `cargo install --help`
		 */
		withCargoInstall(this: Readonly<this>, crate: string, opts?: ContainerWithCargoInstallOpts): this;
	}
}

Container.prototype.withCargoHome = function(
	this: Container,
	volume: CacheVolume,
	{ mountPoint = CARGO_CACHE_MOUNT_POINT }: ContainerWithCargoCacheOpts = {},
): Container {
	return this
		.withEnvVariable('CARGO_HOME', mountPoint)
		.withMountedCache(mountPoint, volume)
		;
};

Container.prototype.withCargoInstall = function(
	this: Container,
	crate: string,
	{ features = [], force = false, defaultFeatures = true, version = '""' }: ContainerWithCargoInstallOpts = {},
): Container {
	const installArgs = ['cargo', 'install', crate, '--features', features.join(','), '--version', version];

	if (!defaultFeatures) { installArgs.push('--no-default-features'); }
	if (force) { installArgs.push('--force'); }

	return this.withExec(installArgs);
};
