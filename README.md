# Scabbard

Miscellaneous utilities for [dagger].

## Installation

```sh
# required
npm install --save-dev https://github.com/Iron-E/scabbard
```

It is suggested to use [tsx] with this project.

## Features

* Dependency injection.
* Pipelines as modules. Queue pipelines by importing modules.
* File-system utilities (e.g. read `.*ignore` files).
* API anti-boilerplate.
	* e.g. `client.withDirectory("/foo", bar).withWorkdir("/foo")` -> `client.withWorkDirectory("/foo", bar)`
* Provides common actions for:
	* [x] Rust

### Pipelines as Modules

`scabbard` supports creating modules that act as pipelines. To do this, use the following template:

```typescript
import { enqueue } from '@iron-e/scabbard';

// (optional) import other pipeline modules. Its pipelines will queued
import './foo-bar';

// queue additional pipelines
enqueue('run my test' , async client => {
	// what happens when the pipeline runs
});

// run queued pipelines if executing this file directly (e.g. `tsx foo.ts`)
await import.meta.filename.runPipelinesIfMain();
```

### Dependency Injection

*


```typescript
import { enqueue, set, setAlias, setTo, setWith } from '@iron-e/scabbard';

// (optional) import other pipeline modules. Its pipelines will queued
import './foo-bar';

// (optional) import other dependencies from modules
import './scope';

// 'rust:alpine' will be stored in a unique identifier as `BASE_IMAGE_NAME`.
// `BASE_IMAGE_NAME`, can be used to change this value later.
const BASE_IMAGE_NAME = setTo('rust:alpine');

//
const WITH_PROJECT = set(client => {
	const directory = client.host().directory('.');
	return client.container().withWorkDirectory(directory);
});

// create a 'base_container' dependency, which uses the 'base_image_name' and 'with_project' dependencies
const BASE_CONTAINER = setFrom([BASE_IMAGE_NAME, WITH_PROJECT], async (client, inject) => {
    const baseImageName = await inject(BASE_IMAGE_NAME); // bring
    const baseImageNameStr = baseImageName.type('string');
});

// queue additional pipelines
enqueue('run my test' , async client => {
	// what happens when the pipeline runs
});

// run queued pipelines if executing this file directly (e.g. `tsx foo.ts`)
await import.meta.filename.runPipelinesIfMain();
```

## Contributing

Have snippets to share? Feel free to open a PR!

[dagger]: https://github.com/dagger/dagger
[tsx]: https://github.com/privatenumber/tsx
