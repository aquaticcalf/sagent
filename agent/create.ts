import { ToolLoopAgent, type ToolLoopAgentSettings } from "ai"

interface CreateAgentSettings extends ToolLoopAgentSettings {
  system: string
}

export function createagent(settings: CreateAgentSettings) {
  const { system, ...rest } = settings
  const newagentsdk = new ToolLoopAgent({ ...rest, instructions: system })
  return newagentsdk // this is temp, i want to make a "agent" class or something, that would have agentsdk as a part of it
}
