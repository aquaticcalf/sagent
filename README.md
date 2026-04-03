## sagent 🧘

a simple runtime agnostic* library for <b><i>agent</i></b> ing <br>
<sub>*well, largely agnostic across typescript and javascript runtimes. the compatibility depends on your chosen bundler, model provider, and registered tools. </sub>

### ok, but what is an _agent_ even?

an agent is just a piece of software that can handle a task from start to finish.

so instead of spitting out a single response and being done, an agent can loop.

it takes input, decides what to do, uses tools if needed, and keeps going based on what happens.

to pull that off, it needs a few things :

- memory, so it remembers what's already happened
- loop, so it can keep going until the job is done
- tools, so it can actually _do_ things and not just talk about them
- awareness, so it knows what's happening around it and not just what you said

### wow, that sounds fun! i want to build one too

it really is fun! 

but when you actually sit down to code one from scratch, 

you quickly realize that it is such a hassle.

sending a single message to an ai model is easy, 

but building a real agent that can loop, remember things, and use tools requires a lot of extra "glue" code.

instead of focusing on the cool parts like making your agent smart or building out your app's unique features, 

you get bogged down trying to make all the moving parts talk to each other.

you can easily waste hours or days just trying to figure out the basic background infrastructure for annoying chores, like:

- remembering the chat history between messages
- making the text stream smoothly into your ui
- tracking exactly when a tool starts working and when it finishes
- figuring out how to stop the agent mid sentence ( for the stop button )
- pausing the agent so a human can approve an action ( like sending an email )
- organizing and loading your different prompt files ( the so called "skills" )

```bash
bun add sagent
```

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

because of this, any ai-sdk-compatible model provider is supported out of the box.

in `sagent`, the `Agent` class manages this loop and the runtime state.
