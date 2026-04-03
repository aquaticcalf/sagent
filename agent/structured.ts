// this file has so many type gymnastics
// i need to rewrite this better when i am more awake
// i am so sleepy and tired

import { generateText, type ModelMessage, type LanguageModel } from "ai"
import type { Schema, InferSchema } from "@ai-sdk/provider-utils"

export interface Output<OUTPUT = unknown, PARTIAL = unknown> {
  name: string
  responseFormat: PromiseLike<{ type: "json"; schema: unknown }>
  parseCompleteOutput(options: { text: string }): Promise<OUTPUT>
  parsePartialOutput(options: { text: string }): Promise<{ partial: PARTIAL } | undefined>
  createElementStreamTransform(): undefined
}

export const Output = {
  object: <T>(options: { schema: Schema<T> }): Output<T, T> => ({
    name: "object",
    responseFormat: Promise.resolve({
      type: "json",
      schema: options.schema.jsonSchema,
    }),
    async parseCompleteOutput({ text }: { text: string }) {
      return JSON.parse(text) as T
    },
    async parsePartialOutput({ text }: { text: string }) {
      return { partial: JSON.parse(text) as T }
    },
    createElementStreamTransform() {
      return undefined
    },
  }),
}

type InferCompleteOutput<O> = O extends Output<infer T, any> ? T : never

export type StructuredResult<T extends Schema<unknown>> = {
  output: InferCompleteOutput<Output<InferSchema<T>>>
}

export async function structured<T extends Schema<unknown>>(
  system: string,
  model: LanguageModel,
  messages: ModelMessage[],
  input: string,
  schema: T,
  pending?: string,
  signal?: AbortSignal,
): Promise<StructuredResult<T>> {
  if (pending) {
    messages.push({ role: "user" as const, content: pending })
  }
  const user_message = { role: "user" as const, content: input }
  messages.push(user_message)

  const result = await generateText({
    system,
    model,
    output: Output.object({ schema }),
    messages,
    ...(signal ? { abortSignal: signal } : {}),
  })
  return result as StructuredResult<T>
}
