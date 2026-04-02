import fm, { type FrontMatterResult } from "front-matter"

interface SkillFrontMatter {
  name?: string
  description?: string
}

export function listskills(files: string[]) {
  return files.map((file) => {
    const { attributes } = fm<SkillFrontMatter>(file) as FrontMatterResult<SkillFrontMatter>
    return { name: attributes.name, description: attributes.description }
  })
}

export function readskill(file: string) {
  const { attributes, body } = fm<SkillFrontMatter>(file) as FrontMatterResult<SkillFrontMatter>
  return { name: attributes.name, description: attributes.description, body: body.trimStart() }
}
