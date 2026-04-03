import { describe, expect, test } from "bun:test"
import { Agent } from "@/agent/index"

const fixture = `---
name: test-skill
description: A skill for testing
---

This is the body content.`

describe("Agent events", () => {
  test("on receives the current stage immediately", async () => {
    const agent = new Agent({
      model: {} as never,
      system: "system",
    })

    const stages: string[] = []
    const unsubscribe = agent.on(async (value) => {
      stages.push(value.stage)
    })

    await Promise.resolve()
    unsubscribe()

    expect(stages[0]).toBe("idle")
  })

  test("tool execution emits start and end stages with pending tool ids", async () => {
    const agent = new Agent({
      model: {} as never,
      system: "system",
      readfile: async () => fixture,
      state: {
        tools: {},
      },
    })

    agent.registerskills(["/skills/test/SKILL.md"])

    const events: Array<{
      stage: string
      pending: string[]
      tool?: { id: string; name: string }
    }> = []
    const unsubscribe = agent.on(async (value) => {
      events.push({
        stage: value.stage,
        pending: value.pending,
        ...(value.tool ? { tool: value.tool } : {}),
      })
    })

    const tool = agent.state.tools.skills
    await (tool as any).execute(
      { action: "list" },
      {
        toolCallId: "tool-1",
        messages: [],
      },
    )

    unsubscribe()

    expect(events.map((event) => event.stage)).toContain("tool_execution_start")
    expect(events.map((event) => event.stage)).toContain("tool_execution_end")

    const start = events.find((event) => event.stage === "tool_execution_start")
    const end = events.find((event) => event.stage === "tool_execution_end")

    expect(start?.pending).toEqual(["tool-1"])
    expect(start?.tool?.id).toBe("tool-1")
    expect(start?.tool?.name).toBe("skills")
    expect(end?.pending).toEqual([])
    expect(end?.tool?.id).toBe("tool-1")
    expect(end?.tool?.name).toBe("skills")
  })
})
