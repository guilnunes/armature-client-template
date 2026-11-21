# Working in a client design system repo

This repo is a client's own design system built on the Armature engine. Read `README.md` first.

## Rules

- Everything under `client/` belongs to the client. Never add Brander names, colors, fonts or signatures (tick rule, settle curve, Brander focus ring) here. If the client wants maker's marks, design their own in `client/owner.json`.
- Never edit `engine/` in a client repo. Engine changes are made in guilnunes/armature and brought in with `node tools/update-engine.mjs <ref>`.
- Never hand edit `client/dist/` or `client/docs/contrast-report.md`. Change tokens, run `node engine/build.mjs client`, commit source and generated files together.
- The build must pass with 0 contrast failures. Never lower an accessibility threshold; change the color.
- No em dash characters in docs.
- Do the work end to end (commits, pushes, merges once CI is green) rather than leaving manual steps.

## Status page

At the end of every working session, update this client's project page in the Notion Projects database (find it by the client's name; if this repo is still the bare template, update "Armature: Brander design foundation", https://www.notion.so/41ffa617db4f8161950eec4be7157791): add a dated line to the status log, and set Status, Last surface, Last worked, Next step and Blocker.
