import { ToolLoopAgent, type ModelMessage } from "ai"

export async function prompt(
  sdk: ToolLoopAgent,
  messages: ModelMessage[],
  input: string,
  pending?: string,
  signal?: AbortSignal,
) {
  if (pending) {
    messages.push({ role: "user" as const, content: pending })
  }
  const user_message = { role: "user" as const, content: input }
  messages.push(user_message)

  const result = await sdk.generate({
    messages,
    ...(signal ? { abortSignal: signal } : {}),
  })
  messages.push(...result.response.messages)
  return result
}
