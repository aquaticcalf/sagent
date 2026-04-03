import { describe, expect, test } from "bun:test"
import { Agent } from "@/agent/index"

const fixture = `---
name: test-skill
description: A skill for testing
---

This is the body content.`

describe("Agent.registerskills", () => {
  test("registers the skills tool using the agent readfile", async () => {
    const agent = new Agent({
      model: {} as never,
      system: "system",
      readfile: async () => fixture,
      state: {
        tools: {},
      },
    })

    agent.registerskills(["/skills/test/SKILL.md"])

    const tool = agent.state.tools.skills
    expect(tool).toBeDefined()

    const listResult = await (tool as any).execute({ action: "list" }, {})
    expect(listResult).toHaveProperty("skills")
    if (!("skills" in listResult)) {
      throw new Error("Expected skill list output.")
    }
    expect(listResult.skills[0]!.name).toBe("test-skill")
  })

  test("does not register the skills tool without a readfile", () => {
    const agent = new Agent({
      model: {} as never,
      system: "system",
      state: {
        tools: {},
      },
    })

    agent.registerskills([fixture], { name: "customskills" })

    expect(agent.state.tools.customskills).toBeUndefined()
  })

  test("registers the skills tool when a readfile is provided in options", async () => {
    const agent = new Agent({
      model: {} as never,
      system: "system",
      state: {
        tools: {},
      },
    })

    agent.registerskills(["/skills/test/SKILL.md"], {
      name: "customskills",
      readfile: async () => fixture,
    })

    const tool = agent.state.tools.customskills
    expect(tool).toBeDefined()

    const loadResult = await (tool as any).execute({ action: "load", name: "test-skill" }, {})
    expect(loadResult).toHaveProperty("body")
    if ("skills" in loadResult) {
      throw new Error("Expected loaded skill output.")
    }
    expect(loadResult.body).toBe("This is the body content.")
  })
})
