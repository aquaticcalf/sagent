## sagent 🧘

```bash
bun add sagent
```

a simple runtime agnostic* library to simply agenting

*well, largely agnostic. the compatibility depends on your chosen bundler, model provider, and registered tools.

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

