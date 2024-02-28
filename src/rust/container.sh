#!/usr/bin/env bash

############################### SETUP ###############################

# @returns ContainerID!
rust_container() {
	declare -r __OPTIONS=a:,c:,x:,p:,r:
	declare -r __LONGOPTIONS=apks:,crates:,exclude:,project-path:,rust-container:
	declare -r __PARSED=$(getopt --options=$__OPTIONS --longoptions=$__LONGOPTIONS --name 'scababrd/rust/container' -- "$@")
	eval set -- "$__PARSED"
	while true; do
		case "$1" in
			-a|--apks)
				declare -r __APKS=$2
				shift 2;;
			-c|--crates)
				declare -nr __CRATES=$2
				shift 2;;
			-p|--project-path)
				declare -r __PROJECT_PATH="$2"
				shift 2;;
			-r|--rust-container)
				declare -r __RUST_CONTAINER="$2"
				shift 2;;
			-x|--exclude)
				declare -gr __EXCLUDE="$2"
				shift 2;;
			--) shift && break;;
			*) printf 'Invalid argument %s' "${1@Q}" && exit;;
		esac
	done

	declare -r __SCRIPT_DIR="${BASH_SOURCE[0]%/*}"

	source "$__SCRIPT_DIR/../prelude.sh"
	source "${SCABBARD_SCRIPTS["json"]}"
	source "${SCABBARD_SCRIPTS["read"]}"

	declare -r PROJECT_DIR="$(dagger query --focus --doc "${SCABBARD_QUERIES["host"]}" --var-json "$(cat <<- EOF
		{
			"step": "get project dir"
			,"exclude": [${__EXCLUDE:-"$(read_dockerignore)"}]
			,"path": "${__PROJECT_PATH:-.}"
		}
		EOF
		)" Directory | query_value)"

	declare -r CARGO_CACHES=( $(dagger query --focus --doc "${SCABBARD_QUERIES["rust/cache"]}" Cargo | query_value) )

	declare -r DEPS="$(dagger query --focus --doc "${SCABBARD_QUERIES["rust/container"]}" \
		--var containerName="rust:${__RUST_CONTAINER:-alpine}" \
		--var project="$PROJECT_DIR" \
		--var cargoBinCache="${CARGO_CACHES[0]}" \
		--var cargoDbCache="${CARGO_CACHES[1]}" \
		--var cargoRegistryCache="${CARGO_CACHES[2]}" \
		WithDepsFrom | query_value)"

	if [[ -n $__APKS ]]; then
		declare -r DEPS_WITH_APKS="$(dagger query --focus --doc "${SCABBARD_QUERIES["exec"]}" --var-json "$(cat <<- EOF
			{
				"step": "apk add $__APKS"
				,"container": "$DEPS"
				,"args": ["apk", "add", "--no-cache", $__APKS]
			}
			EOF
			)" Id | query_value)"
	fi

	declare result="${DEPS_WITH_APKS:-$DEPS}"
	for __CRATE in "${!__CRATES[@]}"; do
		declare features="${__CRATES[$__CRATE]}"
		result="$(dagger query --focus --doc "${SCABBARD_QUERIES["rust/exec"]}" \
			--var step="cargo-install $__CRATE" \
			--var container="$result" \
			--var features="$features" \
			--var crate="$__CRATE" \
			WithCargoInstall | query_value)"
	done

	printf '%s' "$result"
}
