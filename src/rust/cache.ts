import type { Superset } from '../util';
import { Client , type CacheVolume } from '@dagger.io/dagger';

/** The options for {@link Client.cargoHomeCache} */
export type CargoCacheVolumesOpts = Superset<{
	name: string,
}>;

declare module '@dagger.io/dagger' {
	interface Client {
		/**
		 * @param binVolume the unique name for the bin volume. Defaults to {@link BIN_VOLUME_ID}
		 * @param gitDbVolume the unique name for the git db volume. Defaults to {@link GIT_DB_VOLUME_ID}
		 * @param registryVolume the unique name for the registry volume. Defaults to {@link REGISTRY_VOLUME_ID}
		 * @returns the cache volumes
		 */
		cargoHomeCache(this: this, opts?: CargoCacheVolumesOpts): CacheVolume;
	}
}

Client.prototype.cargoHomeCache = function(
	this: Readonly<Client>,
	{ name = "cargo-home" }: CargoCacheVolumesOpts = {},
): CacheVolume {
	return this.cacheVolume(name);
};
