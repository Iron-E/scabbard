import { type CacheVolume, Client } from '@dagger.io/dagger';

/** Cache volumes for Cargo. Corresponds to filepaths in `$CARGO_HOME` */
export type CargoCacheVolumes<T = CacheVolume> = Readonly<{
	/** bin cache */
	bin: T,

	/** git cache */
	git: Readonly<{
		/** db cache */
		db: T,
	}>,

	/** registry cache */
	registry: T,
}>;

export type CargoCacheVolumesOpts = Partial<CargoCacheVolumes<string>>;

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
		cargoCacheVolumes(this: this, opts?: CargoCacheVolumesOpts): CargoCacheVolumes;
	}
}

Client.prototype.cargoCacheVolumes = function(
	this: Readonly<Client>,
	{
		bin = BIN_VOLUME_ID,
		git = { db: GIT_DB_VOLUME_ID },
		registry = REGISTRY_VOLUME_ID,
	}: CargoCacheVolumesOpts = {},
): CargoCacheVolumes {
	return {
		bin: this.cacheVolume(bin),
		git: { db: this.cacheVolume(git.db) },
		registry: this.cacheVolume(registry),
	};
};
