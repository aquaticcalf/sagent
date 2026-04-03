import { describe, expect, test } from "bun:test"
import { Agent } from "@/agent/index"

function create_abortable_model() {
  let last_signal: AbortSignal | undefined

  const model = {
    specificationVersion: "v3",
    provider: "test",
    modelId: "test-model",
    supportedUrls: Promise.resolve({}),
    doGenerate: async (options: any) => {
      last_signal = options.abortSignal
      return await new Promise((_, reject) => {
        options.abortSignal?.addEventListener("abort", () => {
          reject(options.abortSignal.reason ?? new Error("aborted"))
        })
      })
    },
    doStream: async (options: any) => {
      last_signal = options.abortSignal
      return await new Promise((_, reject) => {
        options.abortSignal?.addEventListener("abort", () => {
          reject(options.abortSignal.reason ?? new Error("aborted"))
        })
      })
    },
  }

  return {
    model: model as never,
    get_last_signal: () => last_signal,
  }
}

async function waitfor(predicate: () => boolean, timeout_ms = 1000) {
  const start = Date.now()

  while (!predicate()) {
    if (Date.now() - start > timeout_ms) {
      throw new Error("timed out waiting for condition")
    }
    await Promise.resolve()
  }
}

describe("Agent.abort", () => {
  test("aborts prompt", async () => {
    const { model, get_last_signal } = create_abortable_model()
    const agent = new Agent({
      model,
      system: "system",
    })
    const stages: string[] = []
    const off = agent.on((value) => {
      stages.push(value.stage)
    })

    const run = agent.prompt("hello")
    await waitfor(() => Boolean(get_last_signal()))

    agent.abort("stop prompt")

    await run
    off()
    expect(get_last_signal()?.aborted).toBe(true)
    expect(stages).toContain("aborted")
  })

  test("aborts stream", async () => {
    const { model, get_last_signal } = create_abortable_model()
    const agent = new Agent({
      model,
      system: "system",
    })
    const stages: string[] = []
    const off = agent.on((value) => {
      stages.push(value.stage)
    })

    const run = agent.stream("hello")
    await waitfor(() => Boolean(get_last_signal()))

    agent.abort("stop stream")

    await run
    off()
    expect(get_last_signal()?.aborted).toBe(true)
    expect(stages).toContain("aborted")
  })

  test("aborts structured", async () => {
    const { model, get_last_signal } = create_abortable_model()
    const agent = new Agent({
      model,
      system: "system",
    })
    const stages: string[] = []
    const off = agent.on((value) => {
      stages.push(value.stage)
    })

    const schema = {
      jsonSchema: { type: "object", properties: {} },
    } as never

    const run = agent.structured("hello", schema)
    await waitfor(() => Boolean(get_last_signal()))

    agent.abort("stop structured")

    await run
    off()
    expect(get_last_signal()?.aborted).toBe(true)
    expect(stages).toContain("aborted")
  })
})
