import { enqueue } from '@/pipelines';

enqueue('tsc', 'compile the project to js' , async _ => {
});

import.meta.url.run_pipelines_if_main();
