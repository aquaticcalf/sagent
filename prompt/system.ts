import fm, { type FrontMatterResult } from "front-matter"

interface SystemFrontMatter {
  name?: string
  description?: string
  tags?: string[]
  default: boolean
}

export function listsystems(files: string[]) {
  return files.map((file) => {
    const { attributes } = fm<SystemFrontMatter>(file) as FrontMatterResult<SystemFrontMatter>
    return { name: attributes.name, description: attributes.description, tags: attributes.tags, default: attributes.default }
  })
}

export function readsystem(file: string) {
  const { attributes, body } = fm<SystemFrontMatter>(file) as FrontMatterResult<SystemFrontMatter>
  return { name: attributes.name, description: attributes.description, tags: attributes.tags, default: attributes.default, body: body.trimStart() }
}
