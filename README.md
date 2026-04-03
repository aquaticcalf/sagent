## sagent 🧘

a simple runtime agnostic* library for agenting

<sub>*well, largely agnostic. the compatibility depends on your chosen bundler, model provider, and registered tools.</sub>

```bash
bun add sagent
```

`sagent` gives you the pieces you usually end up wiring yourself eventually, while agenting.

these are for problems you keep solving over and over again.

i am talking about problems like 

- keeping the chat transcript alive across turns
- streaming partial text from assistant into a ui
- knowing when tool execution starts and finishes
- interrupting a run
- injecting a control message into the next turn
- gating tool calls behind approval
- loading skill prompt files

etc.

`sagent` gives you a simple api that handles these problems.

### simple example

let's say you want to build a simple agent that translates regular conversational english into corporate speak.


this is how you'd do that using `sagent`.

```ts
import { Agent } from "sagent"
import { openai } from "@ai-sdk/openai"

const agent = new Agent({
  model: openai("gpt-5.4-nano"),
  system: "rewrite casual english as clear, polished workplace language. keep the original meaning, keep it concise, and output only the rewritten sentence.",
})

const result = await agent.prompt("hey can you finish this soon?")

console.log(result?.text)
```

```txt
# output
Could you please complete this at your earliest convenience?
```

that was easy, right?

an interesting thing to notice here is `sagent` is built on top of [`Vercel's ai sdk`](https://ai-sdk.dev/).

so, any ai-sdk-compatible model provider is supported by `sagent`.

### ok, but what is an _agent_ even?

an agent is just a piece of software that handles multi step tasks.

so instead of spitting out a single response and being done like in our simple example, a real agent can loop.

loop as in - it can take input, decide what to do, use tools if needed, and keep going based on what happens.

so an agent should be able to :

- hold state across turns
- run in a controlled loop
- use tools when it makes sense
- react to immediate results, instead of always waiting for user's response 

in `sagent`, the `Agent` class manages this loop and the runtime state.
