import { globalContext } from './context.mts';
import { handleAgentTask } from './agents.mts';

export async function retryFailedTasks() {
  const retryPromises = globalContext.errorLog.map(async (errorEntry) => {
    const { agentId, task } = errorEntry;
    return handleAgentTask(task, agentId); // Retry the failed task
  });

  const retryOutputs = await Promise.all(retryPromises);
  return retryOutputs;
}

export function logError(agentId: number, task: string, error: string) {
  globalContext.errorLog.push({ agentId, task, error });
}
