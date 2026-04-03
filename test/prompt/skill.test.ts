import { describe, test, expect } from "bun:test"
import { listskills, readskill } from "@/prompt/skill"

const fixture = `---
name: test-skill
description: A skill for testing
---

This is the body content.`

describe("readskill", () => {
  test("returns name, description, and body", async () => {
    const result = await readskill(fixture)
    expect(result.name).toBe("test-skill")
    expect(result.description).toBe("A skill for testing")
    expect(result.body).toBe("This is the body content.")
  })

  test("uses the provided file reader when available", async () => {
    const result = await readskill("/skills/test/SKILL.md", async (file) => {
      expect(file).toBe("/skills/test/SKILL.md")
      return fixture
    })
    expect(result.name).toBe("test-skill")
    expect(result.description).toBe("A skill for testing")
    expect(result.body).toBe("This is the body content.")
  })
})

describe("listskills", () => {
  test("returns list of skills with name and description", async () => {
    const files = [fixture, fixture]
    const results = await listskills(files)
    expect(results).toHaveLength(2)
    expect(results[0]!.name).toBe("test-skill")
    expect(results[0]!.description).toBe("A skill for testing")
    expect(results[1]!.name).toBe("test-skill")
    expect(results[1]!.description).toBe("A skill for testing")
  })

  test("returns empty array for empty input", async () => {
    const results = await listskills([])
    expect(results).toHaveLength(0)
  })

  test("uses the provided file reader for each skill file", async () => {
    const files = ["/skills/a/SKILL.md", "/skills/b/SKILL.md"]
    const results = await listskills(files, async (file) => {
      expect(files).toContain(file)
      return fixture
    })
    expect(results).toHaveLength(2)
    expect(results[0]!.name).toBe("test-skill")
    expect(results[1]!.description).toBe("A skill for testing")
  })
})
