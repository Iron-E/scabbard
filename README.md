# Scabbard

Miscellaneous utilities for [dagger].

## Installation

```sh
# required
npm install --save-dev https://github.com/Iron-E/scabbard
```

It is suggested to use [tsx] with this project.

## Features

* Pipelines as modules. Queue pipelines by importing modules.
* File-system utilities (e.g. read `.*ignore` files).
* API anti-boilerplate.
	* e.g. `client.withDirectory("/foo", bar).withWorkdir("/foo")` -> `client.withWorkDirectory("/foo", bar)`
* Provides common actions for:
	* [x] Rust

### Pipeline Modules

`scabbard` supports creating modules that act as pipelines. To do this, use the following template:

```typescript
import { enqueue } from '@iron-e/scabbard';

// (optional) import other pipeline modules. Its pipelines will queued
import from './foo-bar';

// queue additional pipelines
enqueue('run my test' , async client => {
	// what happens when the pipeline runs
});

// run queued pipelines if executing this file directly (e.g. `tsx foo.ts`)
import.meta.filename.run_pipelines_if_main();
```

## Contributing

Have snippets to share? Feel free to open a PR!

[dagger]: https://github.com/dagger/dagger
[tsx]: https://github.com/privatenumber/tsx
