import { connect, Client } from '@dagger.io/dagger';
import './util';

type Fn = (client: Client) => Promise<void>;

declare global {
	interface ImportMeta {
		/**
		 * {@link run | Run}S all the {@link register}ed pipes in the pipeline if the file `path` was called directly by `node`.
		 * @param path see {@link main}.
		 */
		run_pipelines_if_main(this: this): Promise<void>;
	}
}

/** Registered pipes to run */
const PIPES: { name: string, description: string, fn: Fn }[] = [];

/**
 * Queues a pipeline to be {@link run}.
 * @param name of the pipe
 * @param description of the pipe
 * @param fn what the pipe does
 */
export function enqueue(name: string, description: string, fn: Fn): void {
	PIPES.push({ name, description, fn });
}

/** Runs all the {@link register}ed pipes in the pipeline. */
export async function run(): Promise<void> {
	connect(
		async client => {
			for (const pipe of PIPES) {
				const pipe_client = client.pipeline(pipe.name, { description: pipe.description });
				pipe.fn(pipe_client);
			}
		},
		{ LogOutput: process.stderr },
	);
}

globalThis.ImportMeta.prototype.run_pipelines_if_main = async function(this: globalThis.ImportMeta): Promise<void> {
	if (this.is_main()) {
		run();
	}
};
