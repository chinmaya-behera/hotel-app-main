import { db } from '../../db/index.ts';
import { DrizzlePolicyGrantRepository } from './DrizzlePolicyGrantRepository.ts';
import { PolicyEngineService } from './PolicyEngineService.ts';

export * from './PolicyEngineService.ts';
export { DrizzlePolicyGrantRepository } from './DrizzlePolicyGrantRepository.ts';

export const policyEngine = new PolicyEngineService(new DrizzlePolicyGrantRepository(db));
