import { Container } from '@dagger.io/dagger';

declare module '@dagger.io/dagger' {
	interface Container {
		/**
		 * @param crate from {@link crates.io}.
		 * @param features to enable in the create. Comma separated
		 * @param defaultFeatures to use default features or not
		 * @returns the container with the `path` available as the current working `directory`.
		 * @see `cargo install --help`
		 */
		withCargoInstall(this: this, crate: string, features: string, defaultFeatures: boolean): this;
	}
}

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
