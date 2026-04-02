declare module "front-matter" {
  export interface FrontMatterResult<T> {
    readonly attributes: T
    readonly body: string
    readonly bodyBegin: number
    readonly frontmatter?: string
  }

  interface FM {
    <T>(file: string, options?: { allowUnsafe?: boolean }): FrontMatterResult<T>
    test(file: string): boolean
  }

  const fm: FM
  export default fm
}
