import { type CacheVolume, Client } from '@dagger.io/dagger';

/** Cache volumes for Cargo */
export type CargoCacheVolumes = Readonly<{
	bin: CacheVolume
	git: Readonly<{ db: CacheVolume }>,
	registry: CacheVolume,
}>

/** The default cargo bin volume */
export const BIN_VOLUME_ID = "cargo-bin" as const;

/** The default cargo Git DB volume*/
export const GIT_DB_VOLUME_ID = "cargo-git-db" as const;

/** The default cargo registry volume */
export const REGISTRY_VOLUME_ID = "cargo-registry" as const;

declare module '@dagger.io/dagger' {
	interface Client {
		/**
		 * @param binVolume the unique name for the bin volume. Defaults to {@link BIN_VOLUME_ID}
		 * @param gitDbVolume the unique name for the git db volume. Defaults to {@link GIT_DB_VOLUME_ID}
		 * @param registryVolume the unique name for the registry volume. Defaults to {@link REGISTRY_VOLUME_ID}
		 * @returns the cache volumes
		 */
		cargoCacheVolumes(
			this: this,
			binVolume?: string,
			gitDbVolume?: string,
			registryVolume?: string,
		): CargoCacheVolumes;
	}
}

Client.prototype.cargoCacheVolumes = function(
	this: Client,
	binVolume: string = BIN_VOLUME_ID,
	gitDbVolume: string = GIT_DB_VOLUME_ID,
	registryVolume: string = REGISTRY_VOLUME_ID,
): CargoCacheVolumes {
	return {
		bin: this.cacheVolume(binVolume),
		git: { db: this.cacheVolume(gitDbVolume) },
		registry: this.cacheVolume(registryVolume),
	};
};
