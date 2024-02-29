import './util/array.mjs';
import { describe, expect, it } from 'vitest';
import { parseIgnoreFile } from './fs';

describe(parseIgnoreFile, () => {
	it('caches', async () => {
		const beforeCacheStart = Date.now();
		const beforeCache = await Array.fromAsync(parseIgnoreFile());
		const beforeCacheEnd = Date.now();

		const afterCacheStart = Date.now();
		const afterCache = await Array.fromAsync(parseIgnoreFile());
		const afterCacheEnd = Date.now();

		expect(beforeCache).to.have.same.ordered.members(afterCache, 'cached data was invalid');
		expect(beforeCacheEnd - beforeCacheStart).to.be.greaterThan(afterCacheEnd - afterCacheStart, 'retrieving from cache took longer');
	});

	it('parses', async () => {
		const output = await Array.fromAsync(parseIgnoreFile(undefined, { useCache: false }));
		expect(output).to.have.same.ordered.members([
			"**/*.*proj.user",
			"**/*.back.*",
			"**/*.backup.*",
			"**/*.dbmdl",
			"**/*.jfm",
			"**/.cache",
			"**/.classpath",
			"**/.dockerignore",
			"**/.env",
			"**/.git",
			"**/.gitignore",
			"**/.next",
			"**/.project",
			"**/.settings",
			"**/.toolstarget",
			"**/.vs",
			"**/.vscode",
			"**/build",
			"**/charts",
			"**/compose*",
			"**/dist",
			"**/docker-compose*",
			"**/Dockerfile*",
			"**/node_modules",
			"**/npm-debug.log",
			"**/obj",
			"**/secrets.dev.yaml",
			"**/values.dev.yaml",
			"*.log",
			"*.sublime*",
			"*.tsbuildinfo",
			".DS_*",
			".env*.local",
			".pnp.js",
			"/.pnp",
			"/coverage",
			"bower_components",
			"config",
			"eslintrc.json",
			"LICENSE",
			"logs",
			"next-env.d.ts",
			"node_modules",
			"npm-debug.log*",
			"psd",
			"README.md",
			"sketch",
			"tests",
			"thumb",
			"yarn-debug.log*",
			"yarn-error.log*",
		], "(is the test out of sync with `.dockerignore`?)");
	});
});
