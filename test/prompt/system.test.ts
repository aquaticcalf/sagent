import { describe, test, expect } from "bun:test"
import { listsystems, readsystem } from "@/prompt/system"

const fixture = `---
name: test-system
description: A system for testing
tags:
  - test
  - example
default: true
---

This is the body content.`

describe("readsystem", () => {
  test("returns name, description, tags, default, and body", () => {
    const result = readsystem(fixture)
    expect(result.name).toBe("test-system")
    expect(result.description).toBe("A system for testing")
    expect(result.tags).toEqual(["test", "example"])
    expect(result.default).toBe(true)
    expect(result.body).toBe("This is the body content.")
  })
})

describe("listsystems", () => {
  test("returns list of systems with name, description, tags, and default", () => {
    const files = [fixture, fixture]
    const results = listsystems(files)
    expect(results).toHaveLength(2)
    expect(results[0]!.name).toBe("test-system")
    expect(results[0]!.description).toBe("A system for testing")
    expect(results[0]!.tags).toEqual(["test", "example"])
    expect(results[0]!.default).toBe(true)
    expect(results[1]!.name).toBe("test-system")
    expect(results[1]!.description).toBe("A system for testing")
    expect(results[1]!.tags).toEqual(["test", "example"])
    expect(results[1]!.default).toBe(true)
  })

  test("returns empty array for empty input", () => {
    const results = listsystems([])
    expect(results).toHaveLength(0)
  })
})
