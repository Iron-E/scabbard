import { Container } from '@dagger.io/dagger';
import type { CargoCacheVolumes } from './cache';

/** base dependencies for working with rust projects */
export const BASE_DEPENDENCIES = ["clang", "file", "gcc", "git", "lld", "musl-dev", "openssl", "openssl-dev"] as const;

declare module '@dagger.io/dagger' {
	interface Container {
		/**
		 * @param volumes the cache volumes
		 * @returns the container with the cargo cache volumes mounted
		 * @see {@link Client.cargoCacheVolumes}
		 * @see {@link Container.withMountedCache}
		 */
		withCargoCache(this: Readonly<this>, volumes: CargoCacheVolumes, mountPoint: string): this;

		/**
		 * @param crate from {@link crates.io}.
		 * @param features to enable in the create. Comma separated
		 * @param defaultFeatures to use default features or not
		 * @returns the container with the `path` available as the current working `directory`.
		 * @see `cargo install --help`
		 */
		withCargoInstall(this: Readonly<this>, crate: string, features: string, defaultFeatures: boolean): this;
	}
}

Container.prototype.withCargoCache = function(
	this: Container,
	volumes: CargoCacheVolumes,
	mountPoint: string = '/usr/local/cargo/.ci_cache',
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
	features: string = "",
	defaultFeatures: boolean = true,
): Container {
	const installArgs = ['cargo', 'install', '--force', crate, '--features', features];
	if (!defaultFeatures) {
		installArgs.push('--no-default-features');
	}

	return this.withExec(installArgs);
};
