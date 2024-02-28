import type { ContainerWithDirectoryOpts, Directory } from '@dagger.io/dagger';
import { Container } from '@dagger.io/dagger';

declare module '@dagger.io/dagger' {
	interface Container {
		/**
		 * @param from the container to start from.
		 * @param deps the system packages to install. See also {@link Container.withCargoInstall}
		 * @returns a container `from` the base image
		 */
		fromWithDeps(this: Readonly<this>, from: string, deps: readonly string[]): this;

		/**
		 * @param path see {@link Container.withDirectory} and {@link Container.withWorkDir}
		 * @param directory see {@link Container.withDirectory}
		 * @param opts see {@link Container.withDirectory}
		 * @returns the container with the `path` available as the current working `directory`.
		 */
		withWorkDirectory(
			this: Readonly<this>,
			path: string,
			directory: Directory,
			opts?: Readonly<ContainerWithDirectoryOpts>,
		): this;
	}
}

Container.prototype.fromWithDeps = function(
	this: Readonly<Container>,
	from: string,
	deps: readonly string[],
): Container {
	let args: readonly string[];
	if (from.includes("alpine")) {
		args = ["apk", "install", "--no-cache"];
	} else {
		throw Error(`The base system for '${from}' was not detected.`);
	}

	return this
		.from(from)
		.withExec([...args, ...deps])
		.withEnvVariable('OPENSSL_DIR', '/usr');
};

Container.prototype.withWorkDirectory = function(
	this: Readonly<Container>,
	path: string,
	directory: Directory,
	opts?: Readonly<ContainerWithDirectoryOpts>,
): Container {
	return this.withDirectory(path, directory, opts).withWorkdir(path);
};
