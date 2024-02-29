import type { ContainerWithDirectoryOpts, Directory } from '@dagger.io/dagger';
import type { Superset } from './util';
import { Container } from '@dagger.io/dagger';

/** Opts for {@link Container.fromWithDeps} */
export type ContainerFromWithDepsOpts = Superset<{
	/** The command used to install the dependencies. */
	installCmd: string[],
}>

/** Opts for {@link Container.fromWithDeps} */
export type ContainerWithWorkDirectoryOpts = Superset<
	& ContainerWithDirectoryOpts
	& {
		/** The path where the work directory will be copied to */
		path: string,
	}
>;

/** install commands by distro */
const INSTALL_CMDS = {
	/** install commands for alpine */
	alpine: ["apk", "add", "--no-cache"] as const,
} as const;

declare module '@dagger.io/dagger' {
	interface Container {
		/**
		 * @param from the container to start from.
		 * @param deps the system packages to install. See also {@link Container.withCargoInstall}
		 * @returns a container `from` the base image
		 */
		fromWithDeps(
			this: Readonly<this>,
			from: string,
			deps: readonly string[],
			opts?: ContainerFromWithDepsOpts,
		): this;

		/**
		 * @param path see {@link Container.withDirectory} and {@link Container.withWorkDir}
		 * @param directory see {@link Container.withDirectory}
		 * @param opts see {@link Container.withDirectory}
		 * @returns the container with the `path` available as the current working `directory`.
		 */
		withWorkDirectory(
			this: Readonly<this>,
			directory: Directory,
			opts?: ContainerWithWorkDirectoryOpts,
		): this;
	}
}

/**
 * @param from the image the container is from
 * @param deps the dependencies to install
 * @returns the container with dependencies
 */
function execInstallCmd(
	from: string,
	exec: (args: readonly string[]) => Container,
	{ installCmd }: ContainerFromWithDepsOpts = {},
): Container {
	if (installCmd !== undefined && installCmd.length > 0) {
		return exec(installCmd);
	}

	for (const [distro, cmd] of Object.entries(INSTALL_CMDS)) {
		if (from.includes(distro)) {
			return exec(cmd);
		}
	}

	throw Error(`The base system for '${from}' was not detected.`);
}

Container.prototype.fromWithDeps = function(
	this: Readonly<Container>,
	from: string,
	deps: readonly string[],
	opts?: ContainerFromWithDepsOpts,
): Container {
	let container = this.from(from);
	if (deps.length > 0) {
		container = execInstallCmd(from, args => container.withExec(args.concat(deps)), opts);
	}

	return container.withEnvVariable('OPENSSL_DIR', '/usr');
};

Container.prototype.withWorkDirectory = function(
	this: Readonly<Container>,
	directory: Directory,
	{ path = '/project', ...opts }: ContainerWithWorkDirectoryOpts = {},
): Container {
	return this.withDirectory(path, directory, opts).withWorkdir(path);
};
