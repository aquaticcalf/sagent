import { describe, test, expect } from "bun:test"
import { getskills } from "@/tool/skill"

const fixture = `---
name: test-skill
description: A skill for testing
---

This is the body content.`

describe("getskills", () => {
  test("lists skills with names and descriptions", async () => {
    const tool = getskills(["/skills/test/SKILL.md"], async () => fixture)
    const result = await tool.execute({ action: "list" })

    expect(result).toHaveProperty("skills")
    if (!("skills" in result)) {
      throw new Error("Expected skill list output.")
    }

    expect(result.skills).toHaveLength(1)
    expect(result.skills[0]!.name).toBe("test-skill")
    expect(result.skills[0]!.description).toBe("A skill for testing")
  })

  test("loads a selected skill by name", async () => {
    const tool = getskills(["/skills/test/SKILL.md"], async () => fixture)
    const result = await tool.execute({ action: "load", name: "test-skill" })

    expect(result).toHaveProperty("body")
    if ("skills" in result) {
      throw new Error("Expected loaded skill output.")
    }

    expect(result.name).toBe("test-skill")
    expect(result.description).toBe("A skill for testing")
    expect(result.body).toBe("This is the body content.")
  })

  test("throws when loading without a name", async () => {
    const tool = getskills(["/skills/test/SKILL.md"], async () => fixture)

    await expect(tool.execute({ action: "load" })).rejects.toThrow(
      "Skill name is required when action is 'load'.",
    )
  })

  test("throws when the requested skill does not exist", async () => {
    const tool = getskills(["/skills/test/SKILL.md"], async () => fixture)

    await expect(tool.execute({ action: "load", name: "missing-skill" })).rejects.toThrow(
      "Skill 'missing-skill' not found.",
    )
  })
})
