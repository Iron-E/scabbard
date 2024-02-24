import { connect, Client } from '@dagger.io/dagger';
import { main } from './cli';

type Fn = (client: Client) => Promise<void>;

export class Pipeline {
	/** The pipes in the pipeline */
	private static readonly PIPES: { name: string, description: string, fn: Fn }[] = [];

	/**
	 * {@link run | Run}S all the {@link register}ed pipes in the pipeline if the file `path` was called directly by `node`.
	 * @param path see {@link main}.
	 */
	public static async main(path: string): Promise<void> {
		if (main(path)) {
			Pipeline.run();
		}
	}

	/**
	 * Registers a pipe to be {@link run}.
	 * @param name of the pipe
	 * @param description of the pipe
	 * @param fn what the pipe does
	 */
	public static register(name: string, description: string, fn: Fn): void {
		Pipeline.PIPES.push({ name, description, fn });
	}

	/**
	 * Runs all the {@link register}ed pipes in the pipeline.
	 */
	public static async run(): Promise<void> {
		connect(
			async client => {
				for (const pipe of Pipeline.PIPES) {
					const pipe_client = client.pipeline(pipe.name, { description: pipe.description });
					pipe.fn(pipe_client);
				}
			},
			{ LogOutput: process.stderr },
		);
	}
}
