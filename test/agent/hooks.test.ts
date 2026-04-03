import { describe, expect, test } from "bun:test"
import * as v from "valibot"
import { Agent } from "@/agent/index"

describe("Agent tool hooks", () => {
  test("before_tool_call can change input and after_tool_call sees output", async () => {
    const calls: string[] = []

    const agent = new Agent({
      model: {} as never,
      system: "system",
      tools: {
        echo: {
          inputSchema: v.object({
            value: v.string(),
          }),
          execute: async (input: { value: string }) => {
            calls.push(`execute:${input.value}`)
            return { value: input.value }
          },
        } as any,
      },
      before_tool_call: async ({ tool, input }) => {
        calls.push(`before:${tool.name}`)
        return {
          input: {
            ...(input as { value: string }),
            value: "patched",
          },
        }
      },
      after_tool_call: async ({ tool, output }) => {
        calls.push(`after:${tool.name}:${(output as { value: string }).value}`)
      },
    })

    const tool = agent.state.tools.echo
    const result = await (tool as any).execute(
      { value: "original" },
      {
        toolCallId: "tool-1",
        messages: [],
      },
    )

    expect(result).toEqual({ value: "patched" })
    expect(calls).toEqual(["before:echo", "execute:patched", "after:echo:patched"])
  })

  test("tool_error runs when a tool throws", async () => {
    const calls: string[] = []

    const agent = new Agent({
      model: {} as never,
      system: "system",
      tools: {
        boom: {
          inputSchema: v.object({}),
          execute: async () => {
            throw new Error("boom")
          },
        } as any,
      },
      tool_error: async ({ tool, error }) => {
        calls.push(`${tool.name}:${(error as Error).message}`)
      },
    })

    const tool = agent.state.tools.boom

    await expect(
      (tool as any).execute(
        {},
        {
          toolCallId: "tool-2",
          messages: [],
        },
      ),
    ).rejects.toThrow("boom")

    expect(calls).toEqual(["boom:boom"])
  })
})
