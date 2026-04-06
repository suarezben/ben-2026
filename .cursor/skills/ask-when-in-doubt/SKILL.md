---
name: ask-when-in-doubt
description: >-
  When the user’s message is ambiguous, mostly venting, or could mean either
  explanation or code changes, ask one short clarifying question before refactors,
  new files, or broad edits. Use when intent is unclear, the user asks “why” or
  “what’s going on,” or they did not explicitly say to implement something.
---

# Ask when in doubt

## Default

If you are **not sure** whether the user wants:

- **Explanation only** (why something broke, what changed), or  
- **Implementation** (edit files, refactor, new components),

then **ask one concrete question first** before changing code.

## Triggers (pause and ask)

- Questions like “What is going on?”, “Why did this happen?”, “Is it X or Y?”
- Frustration or strong language **without** a clear imperative (“fix”, “change”, “revert”, “add”).
- Requests that could be read as **diagnosis** or **repair** (“it’s broken”, “not working”).
- Any prompt where the **smallest** compliant action could still be wrong (e.g. they only wanted reassurance).

## What to ask

Keep it **one** question, specific, easy to answer, for example:

- “Do you want me to only explain what failed, or edit the code to fix it?”
- “Should I make the minimal one-line fix, or leave the file as-is?”

## After they answer

Proceed with the **smallest** change that matches their answer. Prefer explaining before refactoring.

## Exceptions (no need to ask)

- They **explicitly** asked to implement, fix, revert, add, remove, or refactor.
- The fix is **trivial and local** (typo, obvious missing import, single-line bug) and they clearly asked for a fix.
- They already confirmed in-thread (e.g. “yes, change it”).

## Anti-patterns

- Don’t refactor structure (extract components, move files) when they only asked *why* something broke.
- Don’t treat emotional venting as automatic permission for large diffs.
