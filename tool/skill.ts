import * as v from "valibot"
import { listskills, readskill, type SkillFileReader } from "../prompt/skill"

export function getskills(skills: string[], readfile?: SkillFileReader) {
  return {
    description:
      "Inspect available skills. First use action 'list' to see skill names and descriptions. Then use action 'load' with the chosen skill name to load its full contents.",
    inputSchema: v.object({
      action: v.union([v.literal("list"), v.literal("load")]),
      name: v.optional(v.string()),
    }),
    execute: async ({ action, name }: { action: "list" | "load"; name?: string }) => {
      if (action === "list") {
        return {
          skills: await listskills(skills, readfile),
        }
      }

      if (!name) {
        throw new Error("Skill name is required when action is 'load'.")
      }

      const available = await listskills(skills, readfile)
      const index = available.findIndex((skill) => skill.name === name)

      if (index === -1) {
        throw new Error(`Skill '${name}' not found.`)
      }

      return await readskill(skills[index]!, readfile)
    },
  }
}
