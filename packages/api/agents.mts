import OpenAI from "openai";
import { globalContext } from "./context.mts";

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: "glhf_ae34819fe2f71ff1658d826ebf39cea1",
  baseURL: "https://glhf.chat/api/openai/v1",
});

export async function handleAgentTask(task: string, agentId: number) {
  try {
    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: `You are a specialized agent for task ${agentId}.` },
        { role: "user", content: task },
      ],
      model: "hf:Qwen/Qwen2.5-Coder-32B-Instruct",
    });

    const agentOutput = completion.choices[0].message.content;
    globalContext.agentOutputs[agentId] = agentOutput;
    return agentOutput;
  } catch (error) {
    globalContext.errorLog.push({ agentId, task, error: error.message });
    return `Error: Agent ${agentId} failed to complete the task.`;
  }
}
