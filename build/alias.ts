import { readdir, readFile, stat, writeFile } from "node:fs/promises"
import path from "node:path"

const dist = path.resolve("dist")

async function getfiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir)
  const files: string[] = []

  for (const entry of entries) {
    const full = path.join(dir, entry)
    const info = await stat(full)

    if (info.isDirectory()) {
      files.push(...(await getfiles(full)))
      continue
    }

    if (full.endsWith(".js") || full.endsWith(".d.ts")) {
      files.push(full)
    }
  }

  return files
}

function rewritealias(file: string, content: string) {
  return content.replaceAll(/from\s+["']@\/([^"']+)["']/g, (_, target) => {
    const source_dir = path.dirname(file)
    const target_path = path.join(dist, target)
    let relative = path.relative(source_dir, target_path).replaceAll(path.sep, "/")

    if (!relative.startsWith(".")) {
      relative = `./${relative}`
    }

    return `from "${relative}"`
  })
}

const files = await getfiles(dist)

for (const file of files) {
  const content = await readFile(file, "utf8")
  const next = rewritealias(file, content)

  if (next !== content) {
    await writeFile(file, next)
  }
}
