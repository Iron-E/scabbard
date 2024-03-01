import type { DepName } from './dep';

/** The error when the user is not permitted to operate on a resource. */
export class DependencyCycleError extends Error {
	constructor(operandDepName: DepName, directDepName: DepName, subDepName: DepName) {
		super(`Failed to add '${directDepName}' as dependency to '${operandDepName}' because \
'${directDepName}' depends on '${subDepName}' (which transitively depends on '${operandDepName}')`);
		Object.setPrototypeOf(this, DependencyCycleError.prototype);
	}
}
