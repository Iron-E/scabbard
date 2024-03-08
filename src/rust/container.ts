import type { Superset } from '../util';
import { Container, type CacheVolume } from '@dagger.io/dagger';

/** Options for {@link Container.withCargoHomeCache} */
export type ContainerWithCargoBuildCacheOpts = Superset<{
	/** the mount point for cargo home */
	mountParentDir: string,
}>;

/** Options for {@link Container.withCargoHomeCache} */
export type ContainerWithCargoHomeCacheOpts = Superset<{
	/** the mount point for cargo home */
	mountPoint: string,
}>;

/** Options for {@link Container.withExecCargo} */
export type ContainerWithExecCargo = Superset<{
	/** arguments to `cargo` */
	cargoArgs: string[],

	/** arguments to the `cargo` command */
	commandArgs: string[],
}>;

/** Options for {@link Container.withExecCargoHack} */
export type ContainerWithExecCargoHack = Superset<
	& ContainerWithExecCargo
	& {
		/** arguments to `cargo hack` command */
		hackArgs: string[],
	}
>;

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

export const CARGO_HOME_CACHE_MOUNT_POINT = '/usr/local/cargo/.ci_cache' as const;

declare module '@dagger.io/dagger' {
	interface Container {
		/**
		 * @param volumes the cache volumes.
		 * @param mountPoint the root dir where the caches are mounted. Defaults to {@link CARGO_HOME_CACHE_MOUNT_POINT}
		 * @returns the container with the cargo cache volumes mounted
		 * @see {@link Client.cargoHomeCache}
		 * @see {@link Container.withMountedCache}
		 */
		withCargoBuildCache(this: Readonly<this>, volume: CacheVolume, opts?: ContainerWithCargoBuildCacheOpts): this;

		/**
		 * @param volumes the cache volumes.
		 * @param mountPoint the root dir where the caches are mounted. Defaults to {@link CARGO_HOME_CACHE_MOUNT_POINT}
		 * @returns the container with the cargo cache volumes mounted
		 * @see {@link Client.cargoHomeCache}
		 * @see {@link Container.withMountedCache}
		 */
		withCargoHomeCache(this: Readonly<this>, volume: CacheVolume, opts?: ContainerWithCargoHomeCacheOpts): this;

		/**
		 * @param crate from {@link crates.io}.
		 * @param features to enable in the create. Comma separated. Defaults to no features.
		 * @param defaultFeatures to use default features or not. Defaults to `true`
		 * @returns the container with the `path` available as the current working `directory`.
		 * @see `cargo install --help`
		 */
		withCargoInstall(this: Readonly<this>, crate: string, opts?: ContainerWithCargoInstallOpts): this;

		/**
		 * @param command the cargo command to run, e.g. 'test'
		 * @param opts the options
		 * @returns a {@link Container} which will execute the given `cargo` command
		 */
		withExecCargo(this: Readonly<Container>, command: string, opts?: ContainerWithExecCargo): this;

		/**
		 * @param command the cargo command to run, e.g. 'test'
		 * @param opts the options
		 * @returns a {@link Container} which will execute the given `cargo` command using `cargo hack`
		 */
		withExecCargoHack(this: Readonly<Container>, command: string, opts?: ContainerWithExecCargoHack): this;
	}
}

Container.prototype.withCargoBuildCache = function(
	this: Readonly<Container>,
	volume: CacheVolume,
	{ mountParentDir = '/project' }: ContainerWithCargoBuildCacheOpts = {},
): Container {
	return this.withMountedCache(`${mountParentDir}/target/`, volume);
};

Container.prototype.withCargoHomeCache = function(
	this: Readonly<Container>,
	volume: CacheVolume,
	{ mountPoint = CARGO_HOME_CACHE_MOUNT_POINT }: ContainerWithCargoHomeCacheOpts = {},
): Container {
	return this
		.withEnvVariable('CARGO_HOME', mountPoint)
		.withMountedCache(mountPoint, volume)
		;
};

Container.prototype.withCargoInstall = function(
	this: Readonly<Container>,
	crate: string,
	{ features = [], force = false, defaultFeatures = true, version = undefined }: ContainerWithCargoInstallOpts = {},
): Container {
	const crateVersion = version === undefined || version.length < 1 ? crate : `${crate}@${version}`;
	const installArgs = ['cargo', 'install', crateVersion, '--features', features.join(',')];

	if (!defaultFeatures) { installArgs.push('--no-default-features'); }
	if (force) { installArgs.push('--force'); }

	return this.withExec(installArgs);
};

Container.prototype.withExecCargo = function(
	this: Readonly<Container>,
	command: string,
	{ cargoArgs = [], commandArgs = [] }: ContainerWithExecCargo = {},
): Container {
	return this.pipeline(command).withExec(['cargo', ...cargoArgs, command, ...commandArgs]);
};

Container.prototype.withExecCargoHack = function(
	this: Readonly<Container>,
	command: string,
	{ cargoArgs = [], commandArgs = [], hackArgs = ['--feature-powerset'] }: ContainerWithExecCargoHack = {},
): Container {
	return this.withExecCargo(command, {
		cargoArgs: [...cargoArgs, 'hack', ...hackArgs],
		commandArgs,
	});
};
