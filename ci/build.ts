import '@/container';
import { enqueue } from '@/pipelines';

enqueue('tsc', 'compile the project to js', async client => {
	const base = client.container().from('node:18-alpine');
	const source_dir = client.host().directory('.', { exclude: ['node_modules/'] });

	const source = base.withDirectoryWorkdir('/src', source_dir);
	const deps = source.withExec(['npm', 'ci', '--omit=dev']);
});

import.meta.url.run_pipelines_if_main();
