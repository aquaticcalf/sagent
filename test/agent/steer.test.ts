import { describe, expect, test } from "bun:test"
import { Agent } from "@/agent/index"

describe("Agent.steer", () => {
  test("adds one pending message that is drained on the next turn", async () => {
    const calls: any[] = []
    const agent = new Agent({
      model: {
        specificationVersion: "v3",
        provider: "test",
        modelId: "test-model",
        supportedUrls: Promise.resolve({}),
        doGenerate: async (options: any) => {
          calls.push(options.prompt)
          return {
            content: [{ type: "text", text: "ok" }],
            finishReason: { unified: "stop" },
            usage: {
              inputTokens: { total: 0, cachedInputTokens: 0 },
              outputTokens: { total: 0, reasoningTokens: 0 },
              totalTokens: 0,
            },
            warnings: [],
            request: {},
            response: {
              id: "resp-1",
              timestamp: new Date(),
              modelId: "test-model",
            },
          }
        },
        doStream: async () => {
          throw new Error("not implemented")
        },
      } as never,
      system: "system",
    })

    agent.steer("use concise wording")
    expect(agent.state.pending).toEqual(["use concise wording"])

    await agent.prompt("write the answer")

    expect(agent.state.pending).toEqual([])
    expect(calls).toHaveLength(1)
    const user_messages = calls[0].filter((message: any) => message.role === "user")
    expect(user_messages).toHaveLength(2)
    expect(user_messages[0].content[0].text).toBe("use concise wording")
    expect(user_messages[1].content[0].text).toBe("write the answer")
  })
})
