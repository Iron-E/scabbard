import { connect, type Client } from '@dagger.io/dagger';
import './util';

type Fn = (client: Client) => Promise<void>;

declare global {
	interface String {
		/**
		 * {@link run | Run}S all the {@link register}ed pipes in the pipeline if the file `path` was called directly by `node`.
		 * @param path see {@link main}.
		 */
		runPipelinesIfMain(this: Readonly<this>): Promise<void>;
	}
}

/** Registered pipes to run */
const PIPES: Readonly<{ name: string, fn: Fn }>[] = [];

/**
 * Queues a pipeline to be {@link run}.
 * @param name of the pipe
 * @param description of the pipe
 * @param fn what the pipe does
 */
export function enqueue(name: string, fn: Fn): void {
	PIPES.push({ name, fn });
}

/** Runs all the {@link register}ed pipes in the pipeline. */
export async function run(): Promise<void> {
	connect(
		async client => {
			const startedPipes = Array.from(startPipesOn(client));
			await Promise.all(startedPipes);
		},
		{ LogOutput: process.stderr },
	);
}

/**
 * @param client to start the pipes on
 * @returns handles to the started pipes
 */
function* startPipesOn(client: Client): Generator<Promise<void>, void> {
	for (const pipe of PIPES) {
		const pipeClient = client.pipeline(pipe.name);
		yield pipe.fn(pipeClient);
	}
}

String.prototype.runPipelinesIfMain = async function(this: string): Promise<void> {
	if (this.isMain()) {
		await run();
	}
};
