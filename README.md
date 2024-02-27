# Scabbard

Miscellaneous utilities for [dagger].

## Installation

In your project, where you keep your [dagger] files (e.g. `my_project/ci`), run:

```sh
git submodule init https://github.com/Iron-E/scabbard
```

> [!TIP]
>
> If you only need specific files, you can run [`git-sparse-checkout`].

## Usage

### GraphQL queries

The GraphQL queries can be used with the following command:

```sh
dagger query --doc "<path_to_document>.graphql" --focus \
	[... --var foo=bar ] \
	<query_name> |
	jq -r '.. | .return? // empty'
```

> [!IMPORTANT]
>
> Uses [`jq`] to parse output

### Scripts

Simply `source` the file you wish to use:

```sh
source "<path_to_document>.sh"
```

Then you can use the functions inside the file.

## Contributing

Have snippets to share? Feel free to open a PR!

[`git-sparse-checkout`]: https://git-scm.com/docs/git-sparse-checkout
[`jq`]: https://github.com/jqlang/jq
[dagger]: https://github.com/dagger/dagger
