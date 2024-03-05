import { declare } from '../pipelines';

const prefix = '__scabbardClient' as const;

/**
 * @returns the project directory (defaults to '.')
 */
export const project = declare(`${prefix}Project`, client => client.host().directory('.'));
