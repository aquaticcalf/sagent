import type { LanguageModel, ModelMessage, ToolSet } from "ai"
import type { SkillFileReader } from "@/prompt"

export interface State {
  system: string
  model: LanguageModel
  tools: ToolSet
  readfile?: SkillFileReader

  messages: ModelMessage[]
  pending: string[]

  streaming: boolean
  draft?: ModelMessage | null

  error?: Error
}
