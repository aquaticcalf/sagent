import type { LanguageModel, Tool } from "ai"

export interface State {
  system: string
  model: LanguageModel
  tools: Tool[]
}
