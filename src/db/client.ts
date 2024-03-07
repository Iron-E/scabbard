import type { Struct, Superset } from '../util';
import { Client, Directory, type Service } from '@dagger.io/dagger';

/** Opts for {@link Client.dbService} */
export type ClientDbServiceOpts = Superset<{
	/**
	 * Directories containing initialization scripts. Keyed on mount point in container to host machine directory / path.
	 */
	initScriptDirs: [string | Directory, string][],

	/** Environment variables to set */
	env: Struct<string, string>,

	/** The port number to `expose`, if any */
	expose: number,
}>

declare module '@dagger.io/dagger' {
	interface Client {
		/**
		 * Create a simple database {@link Service}. Not guaranteed to work with all databases, but should be flexible.
		 * @param from the image of the DB
		 * @returns the database service.
		 */
		dbService(this: Readonly<this>, from: string, opts?: ClientDbServiceOpts): Service;
	}
}

Client.prototype.dbService = function(
	this: Readonly<Client>,
	from: string,
	{ env = {}, expose = undefined, initScriptDirs = [] }: ClientDbServiceOpts = {},
) {
	let db = this
		.container()
		.pipeline(`${from} service`)
		.from(from)
		;

	const host = this.host();
	for (const [hostDir, mountPoint] of initScriptDirs) {
		const hostDirectory = hostDir instanceof Directory ? hostDir : host.directory(hostDir);
		db = db.withDirectory(mountPoint, hostDirectory);
	}

	for (const [varName, value] of Object.entries(env)) {
		db = db.withEnvVariable(varName, value);
	}

	if (expose !== undefined) {
		db = db.withExposedPort(expose);
	}

	return db.asService();
}
