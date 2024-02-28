import { Container } from '@dagger.io/dagger';
import type { CargoCacheVolumes } from './cache';

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
		withCargoCache(this: Readonly<this>, volumes: CargoCacheVolumes, mountPoint?: string): this;

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
			features?: readonly string[],
			defaultFeatures?: boolean,
		): this;
	}
}

Container.prototype.withCargoCache = function(
	this: Container,
	volumes: CargoCacheVolumes,
	mountPoint: string = CARGO_CACHE_MOUNT_POINT,
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
	features: readonly string[] = [],
	defaultFeatures: boolean = true,
): Container {
	const installArgs = ['cargo', 'install', '--force', crate, '--features', features.join(',')];
	if (!defaultFeatures) {
		installArgs.push('--no-default-features');
	}

	return this.withExec(installArgs);
};
