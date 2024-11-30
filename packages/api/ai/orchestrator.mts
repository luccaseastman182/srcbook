import { handleAgentTask } from './agents.mts';
import { validateOutputs } from './validation.mts';
import { globalContext } from './context.mts';
import { retryFailedTasks } from './error-handler.mts';

export async function orchestrateTasks() {
  const taskPromises = globalContext.parsedTasks.map((task, index) => {
    return handleAgentTask(task, index);
  });

  // Wait for all agents to complete their tasks
  const agentOutputs = await Promise.all(taskPromises);

  // Validate and consolidate outputs
  const validatedOutputs = validateOutputs(agentOutputs);

  // Retry failed tasks if any
  if (globalContext.errorLog.length > 0) {
    const retryOutputs = await retryFailedTasks();
    validatedOutputs.push(...validateOutputs(retryOutputs));
  }

  return validatedOutputs.join('\n');
}
