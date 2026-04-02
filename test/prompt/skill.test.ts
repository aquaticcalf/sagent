import { describe, test, expect } from "bun:test"
import { listskills, readskill } from "@/prompt/skill"

const fixture = `---
name: test-skill
description: A skill for testing
---

This is the body content.`

describe("readskill", () => {
  test("returns name, description, and body", () => {
    const result = readskill(fixture)
    expect(result.name).toBe("test-skill")
    expect(result.description).toBe("A skill for testing")
    expect(result.body).toBe("This is the body content.")
  })
})

describe("listskills", () => {
  test("returns list of skills with name and description", () => {
    const files = [fixture, fixture]
    const results = listskills(files)
    expect(results).toHaveLength(2)
    expect(results[0]!.name).toBe("test-skill")
    expect(results[0]!.description).toBe("A skill for testing")
    expect(results[1]!.name).toBe("test-skill")
    expect(results[1]!.description).toBe("A skill for testing")
  })

  test("returns empty array for empty input", () => {
    const results = listskills([])
    expect(results).toHaveLength(0)
  })
})
