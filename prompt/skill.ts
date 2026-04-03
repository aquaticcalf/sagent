import fm, { type FrontMatterResult } from "front-matter"

interface SkillFrontMatter {
  name?: string
  description?: string
}

export type SkillFileReader = (file: string) => string | Promise<string>

async function readskillfile(file: string, readfile?: SkillFileReader) {
  return readfile ? await readfile(file) : file
}

export async function listskills(files: string[], readfile?: SkillFileReader) {
  return Promise.all(
    files.map(async (file) => {
      const content = await readskillfile(file, readfile)
      const { attributes } = fm<SkillFrontMatter>(content) as FrontMatterResult<SkillFrontMatter>
      return { name: attributes.name, description: attributes.description }
    }),
  )
}

export async function readskill(file: string, readfile?: SkillFileReader) {
  const content = await readskillfile(file, readfile)
  const { attributes, body } = fm<SkillFrontMatter>(content) as FrontMatterResult<SkillFrontMatter>
  return { name: attributes.name, description: attributes.description, body: body.trimStart() }
}
