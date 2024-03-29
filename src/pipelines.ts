import './util';
import { connect, type Client } from '@dagger.io/dagger';
import { Scope, type AsyncInjectFn } from './scope';

type Fn = (client: Client, inject: AsyncInjectFn) => Promise<void>;

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
const pipelines: Fn[] = [];

/** Values which can be provided to `pipelines` via {@link Scope.inject}  */
const scope = new Scope<Client>();
export const { set, setAlias, setCopy, setOver, setTo, setWith } = scope;

/**
 * Queues a pipeline to be {@link run}.
 * @param name of the pipe
 * @param description of the pipe
 * @param fn what the pipe does
 */
export function enqueue(fn: Fn): void {
	pipelines.push(fn);
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
	const inject = scope.prepareInjector(client);
	for (const pipeline of pipelines) {
		yield pipeline(client, inject);
	}
}

String.prototype.runPipelinesIfMain = async function(this: string): Promise<void> {
	if (this.isMain()) {
		await run();
	}
};
