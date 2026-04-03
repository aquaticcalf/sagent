import type { ModelMessage, ToolSet } from "ai"
import type { ToolExecutionOptions } from "@ai-sdk/provider-utils"

export type Stage =
  | "idle"
  | "message_start"
  | "message_update"
  | "message_end"
  | "tool_execution_start"
  | "tool_execution_end"
  | "turn_end"
  | "aborted"
  | "agent_end"
  | "error"

export interface SignalValue {
  stage: Stage
  pending: string[]
  text?: string
  message?: ModelMessage
  tool?: {
    id: string
    name: string
  }
  error?: Error
}

export type SignalListener = (value: SignalValue) => void | Promise<void>

export interface ToolHookContext<INPUT = unknown> {
  tool: {
    id: string
    name: string
  }
  input: INPUT
  messages: ModelMessage[]
}

export type BeforeToolCallResult<INPUT = unknown> = void | {
  input?: INPUT
  output?: unknown
}

export type BeforeToolCallHook = (
  context: ToolHookContext,
) => BeforeToolCallResult | Promise<BeforeToolCallResult>

export type AfterToolCallHook = (
  context: ToolHookContext & { output: unknown },
) => void | Promise<void>

export type ToolErrorHook = (context: ToolHookContext & { error: unknown }) => void | Promise<void>

export interface ToolHooks {
  before_tool_call?: BeforeToolCallHook
  after_tool_call?: AfterToolCallHook
  tool_error?: ToolErrorHook
}

function isasynciterable(value: unknown): value is AsyncIterable<unknown> {
  return typeof value === "object" && value !== null && Symbol.asyncIterator in value
}

function getsignalvalue(
  current: SignalValue,
  next: Partial<SignalValue> & { stage: Stage },
): SignalValue {
  return {
    stage: next.stage,
    pending: next.pending ?? current.pending,
    ...(next.text !== undefined
      ? { text: next.text }
      : current.text !== undefined
        ? { text: current.text }
        : {}),
    ...(next.message !== undefined
      ? { message: next.message }
      : current.message !== undefined
        ? { message: current.message }
        : {}),
    ...(next.tool !== undefined
      ? { tool: next.tool }
      : current.tool !== undefined
        ? { tool: current.tool }
        : {}),
    ...(next.error !== undefined
      ? { error: next.error }
      : current.error !== undefined
        ? { error: current.error }
        : {}),
  }
}

export class Signal {
  private listeners = new Set<SignalListener>()
  private value: SignalValue = {
    stage: "idle",
    pending: [],
  }

  get() {
    return this.value
  }

  subscribe(listener: SignalListener) {
    this.listeners.add(listener)
    void listener(this.value)

    return () => {
      this.listeners.delete(listener)
    }
  }

  async set(next: Partial<SignalValue> & { stage: Stage }) {
    this.value = getsignalvalue(this.value, next)
    await Promise.all([...this.listeners].map((listener) => listener(this.value)))
  }
}

async function finishsuccess(
  signal: Signal,
  pending: string[],
  tool: { id: string; name: string },
) {
  await signal.set({
    stage: "tool_execution_end",
    pending: pending.filter((id) => id !== tool.id),
    tool,
  })
}

async function finisherror(
  signal: Signal,
  pending: string[],
  tool: { id: string; name: string },
  error: unknown,
) {
  await signal.set({
    stage: "tool_execution_end",
    pending: pending.filter((id) => id !== tool.id),
    tool,
    ...(error instanceof Error ? { error } : {}),
  })
}

export function wraptool<T extends Record<string, unknown>>(
  tool_name: string,
  tool: T,
  signal: Signal,
  hooks: ToolHooks = {},
) {
  const wrapped_tool = tool as T & {
    execute?: ((input: any, options: ToolExecutionOptions) => unknown) | undefined
    __wrapped_for_signal?: boolean
  }

  if (!wrapped_tool.execute || wrapped_tool.__wrapped_for_signal === true) {
    return tool
  }

  const execute = wrapped_tool.execute

  wrapped_tool.execute = (input: any, options: ToolExecutionOptions) => {
    const tool = {
      id: options.toolCallId,
      name: tool_name,
    }
    const pending = [...signal.get().pending, tool.id]

    return (async () => {
      await signal.set({
        stage: "tool_execution_start",
        pending,
        tool,
      })

      let next_input = input

      try {
        const before = await hooks.before_tool_call?.({
          tool,
          input: next_input,
          messages: options.messages,
        })

        if (before && "input" in before && before.input !== undefined) {
          next_input = before.input
        }

        if (before && "output" in before && before.output !== undefined) {
          await hooks.after_tool_call?.({
            tool,
            input: next_input,
            messages: options.messages,
            output: before.output,
          })
          await finishsuccess(signal, pending, tool)
          return before.output
        }

        const output = execute(next_input, options)

        if (isasynciterable(output)) {
          return (async function* () {
            try {
              for await (const chunk of output) {
                yield chunk
              }

              await hooks.after_tool_call?.({
                tool,
                input: next_input,
                messages: options.messages,
                output,
              })
              await finishsuccess(signal, pending, tool)
            } catch (error) {
              await hooks.tool_error?.({
                tool,
                input: next_input,
                messages: options.messages,
                error,
              })
              await finisherror(signal, pending, tool, error)
              throw error
            }
          })()
        }

        const resolved_output = await output

        await hooks.after_tool_call?.({
          tool,
          input: next_input,
          messages: options.messages,
          output: resolved_output,
        })
        await finishsuccess(signal, pending, tool)
        return resolved_output
      } catch (error) {
        await hooks.tool_error?.({
          tool,
          input: next_input,
          messages: options.messages,
          error,
        })
        await finisherror(signal, pending, tool, error)
        throw error
      }
    })()
  }

  wrapped_tool.__wrapped_for_signal = true
  return wrapped_tool as T
}

export function wraptools(tools: ToolSet, signal: Signal, hooks: ToolHooks = {}) {
  for (const [tool_name, tool] of Object.entries(tools)) {
    if (tool) {
      wraptool(tool_name, tool, signal, hooks)
    }
  }
}
