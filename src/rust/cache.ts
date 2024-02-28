import { type CacheVolume, Client } from '@dagger.io/dagger';

/** Cache volumes for Cargo */
export type CargoCacheVolumes = Readonly<{
	bin: CacheVolume
	git: Readonly<{ db: CacheVolume }>,
	registry: CacheVolume,
}>

declare module '@dagger.io/dagger' {
	interface Client {
		/**
		 * @param path see {@link Container.withDirectory} and {@link Container.withWorkDir}
		 * @param directory see {@link Container.withDirectory}
		 * @param opts see {@link Container.withDirectory}
		 * @returns the container with the `path` available as the current working `directory`.
		 */
		cargoCacheVolumes(this: this, binVolume: string, gitDbVolume: string, registryVolume: string): CargoCacheVolumes;
	}
}

Client.prototype.cargoCacheVolumes = function(
	this: Client,
	binVolume: string = "cargo-bin",
	gitDbVolume: string = "cargo-git-db",
	registryVolume: string = "cargo-registry",
): CargoCacheVolumes {
	return {
		bin: this.cacheVolume(binVolume),
		git: { db: this.cacheVolume(gitDbVolume) },
		registry: this.cacheVolume(registryVolume),
	};
};
