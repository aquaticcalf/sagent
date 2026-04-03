import { ToolLoopAgent, type ToolLoopAgentSettings } from "ai"
import type { Schema } from "@ai-sdk/provider-utils"
import { prompt } from "./prompt"
import { stream } from "./stream"
import { structured, type StructuredResult } from "./structured"
import type { State } from "@/state"
import type { SkillFileReader } from "@/prompt"
import { getskills } from "@/tool/skill"
import { Signal, type SignalListener, type ToolHooks, wraptool, wraptools } from "./signal"

export class Agent {
  private sdk: ToolLoopAgent
  private signal = new Signal()
  private tool_hooks: ToolHooks
  private abort_controller: AbortController | undefined
  state: State

  constructor(
    settings: ToolLoopAgentSettings & {
      system: string
      readfile?: SkillFileReader
      state?: Partial<State>
      before_tool_call?: ToolHooks["before_tool_call"]
      after_tool_call?: ToolHooks["after_tool_call"]
      tool_error?: ToolHooks["tool_error"]
    },
  ) {
    const tools = settings.state?.tools ?? settings.tools ?? {}
    const { state, before_tool_call, after_tool_call, tool_error, ...sdk_settings } = settings
    this.tool_hooks = {
      ...(before_tool_call ? { before_tool_call } : {}),
      ...(after_tool_call ? { after_tool_call } : {}),
      ...(tool_error ? { tool_error } : {}),
    }
    wraptools(tools, this.signal, this.tool_hooks)
    this.sdk = new ToolLoopAgent({ ...sdk_settings, tools, instructions: settings.system })
    this.state = {
      system: settings.system,
      model: settings.model,
      tools,
      messages: [],
      pending: [],
      streaming: false,
      ...(settings.readfile ? { readfile: settings.readfile } : {}),
      ...state,
    }
  }

  get readfile() {
    return this.state.readfile
  }

  on(listener: SignalListener) {
    return this.signal.subscribe(listener)
  }

  abort(reason?: unknown) {
    this.abort_controller?.abort(reason)
  }

  registerreadfile(readfile: SkillFileReader) {
    this.state.readfile = readfile
  }

  steer(message: string) {
    this.state.pending.push(message)
  }

  registerskills(skills: string[], options?: { name?: string; readfile?: SkillFileReader }) {
    const tool_name = options?.name ?? "skills"
    const readfile = options?.readfile ?? this.state.readfile
    if (!readfile) {
      return
    }
    this.state.tools[tool_name] = wraptool(
      tool_name,
      getskills(skills, readfile),
      this.signal,
      this.tool_hooks,
    ) as unknown as (typeof this.state.tools)[string]
  }

  async prompt(input: string) {
    const abort_controller = new AbortController()
    this.abort_controller = abort_controller

    try {
      const pending = this.state.pending.shift()

      await this.signal.set({
        stage: "message_start",
        pending: this.state.pending,
        text: "",
      })

      const result = await prompt(
        this.sdk,
        this.state.messages,
        input,
        pending,
        abort_controller.signal,
      )
      const message = result.response.messages.at(-1)

      if (message) {
        await this.signal.set({
          stage: "message_end",
          pending: this.signal.get().pending,
          message,
          text: "",
        })
      }

      await this.signal.set({
        stage: "turn_end",
        pending: this.signal.get().pending,
      })
      await this.signal.set({
        stage: "agent_end",
        pending: this.signal.get().pending,
      })

      return result
    } catch (e) {
      this.state.error = e as Error
      if (abort_controller.signal.aborted) {
        await this.signal.set({
          stage: "aborted",
          pending: this.signal.get().pending,
          ...(e instanceof Error ? { error: e } : {}),
        })
        await this.signal.set({
          stage: "agent_end",
          pending: this.signal.get().pending,
          ...(e instanceof Error ? { error: e } : {}),
        })
        return
      }
      await this.signal.set({
        stage: "error",
        pending: this.signal.get().pending,
        ...(e instanceof Error ? { error: e } : {}),
      })
      await this.signal.set({
        stage: "agent_end",
        pending: this.signal.get().pending,
        ...(e instanceof Error ? { error: e } : {}),
      })
    } finally {
      if (this.abort_controller === abort_controller) {
        this.abort_controller = undefined
      }
    }
  }

  async stream(input: string) {
    this.state.streaming = true
    this.state.draft = null
    const abort_controller = new AbortController()
    this.abort_controller = abort_controller

    try {
      const pending = this.state.pending.shift()

      await this.signal.set({
        stage: "message_start",
        pending: this.signal.get().pending,
        text: "",
      })

      const result = await stream(
        this.sdk,
        this.state.messages,
        input,
        pending,
        abort_controller.signal,
      )
      let text = ""

      for await (const chunk of result.textStream) {
        text += chunk
        this.state.draft = {
          role: "assistant",
          content: text,
        }
        await this.signal.set({
          stage: "message_update",
          pending: this.signal.get().pending,
          text,
        })
      }

      const response = await result.response
      const message = response.messages.at(-1)

      if (message) {
        await this.signal.set({
          stage: "message_end",
          pending: this.signal.get().pending,
          message,
          text,
        })
      }

      await this.signal.set({
        stage: "turn_end",
        pending: this.signal.get().pending,
        text,
      })
      await this.signal.set({
        stage: "agent_end",
        pending: this.signal.get().pending,
        text,
      })

      return result
    } catch (e) {
      this.state.error = e as Error
      if (abort_controller.signal.aborted) {
        await this.signal.set({
          stage: "aborted",
          pending: this.signal.get().pending,
          ...(e instanceof Error ? { error: e } : {}),
        })
        await this.signal.set({
          stage: "agent_end",
          pending: this.signal.get().pending,
          ...(e instanceof Error ? { error: e } : {}),
        })
        return
      }
      await this.signal.set({
        stage: "error",
        pending: this.signal.get().pending,
        ...(e instanceof Error ? { error: e } : {}),
      })
      await this.signal.set({
        stage: "agent_end",
        pending: this.signal.get().pending,
        ...(e instanceof Error ? { error: e } : {}),
      })
    } finally {
      this.state.streaming = false
      this.state.draft = null
      if (this.abort_controller === abort_controller) {
        this.abort_controller = undefined
      }
    }
  }

  async structured<T extends Schema<unknown>>(
    input: string,
    schema: T,
  ): Promise<StructuredResult<T> | undefined> {
    const abort_controller = new AbortController()
    this.abort_controller = abort_controller

    try {
      const pending = this.state.pending.shift()

      const result = await structured(
        this.state.system,
        this.state.model,
        this.state.messages,
        input,
        schema,
        pending,
        abort_controller.signal,
      )
      await this.signal.set({
        stage: "turn_end",
        pending: this.signal.get().pending,
      })
      await this.signal.set({
        stage: "agent_end",
        pending: this.signal.get().pending,
      })
      return result
    } catch (e) {
      this.state.error = e as Error
      if (abort_controller.signal.aborted) {
        await this.signal.set({
          stage: "aborted",
          pending: this.signal.get().pending,
          ...(e instanceof Error ? { error: e } : {}),
        })
        await this.signal.set({
          stage: "agent_end",
          pending: this.signal.get().pending,
          ...(e instanceof Error ? { error: e } : {}),
        })
        return
      }
      await this.signal.set({
        stage: "error",
        pending: this.signal.get().pending,
        ...(e instanceof Error ? { error: e } : {}),
      })
      await this.signal.set({
        stage: "agent_end",
        pending: this.signal.get().pending,
        ...(e instanceof Error ? { error: e } : {}),
      })
    } finally {
      if (this.abort_controller === abort_controller) {
        this.abort_controller = undefined
      }
    }
  }
}
