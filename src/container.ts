import type { ContainerWithDirectoryOpts, Directory } from '@dagger.io/dagger';
import { Container } from '@dagger.io/dagger';

declare module '@dagger.io/dagger' {
	interface Container {
		/**
		 * @param path see {@link Container.withDirectory} and {@link Container.withWorkDir}
		 * @param directory see {@link Container.withDirectory}
		 * @param opts see {@link Container.withDirectory}
		 * @returns the container with the `path` available as the current working `directory`.
		 */
		withDirectoryWorkdir(this: this, path: string, directory: Directory, opts?: ContainerWithDirectoryOpts): this;
	}
}

Container.prototype.withDirectoryWorkdir = function(
	this: Container,
	path: string,
	directory: Directory,
	opts?: ContainerWithDirectoryOpts,
): Container {
	return this.withDirectory(path, directory, opts).withWorkdir(path);
};
