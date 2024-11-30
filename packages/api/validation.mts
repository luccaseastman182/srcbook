export function validateOutputs(agentOutputs: string[]) {
  const validatedOutputs = [];

  agentOutputs.forEach((output, index) => {
    // Basic validation: Check for empty or duplicate outputs
    if (!output || validatedOutputs.includes(output)) {
      globalContext.errorLog.push({ agentId: index, error: "Validation failed" });
      validatedOutputs.push(`Agent ${index} output is invalid.`);
    } else {
      validatedOutputs.push(output);
    }
  });

  return validatedOutputs;
}
