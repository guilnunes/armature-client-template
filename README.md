# Client design system template

Starting point for a client's own design system, built on the [Armature](https://github.com/guilnunes/armature) engine. Create each client's repo from this template (private), fill in `client/`, and hand the repo over at the end of the project. It builds on its own and depends on nothing outside itself.

## What is in here

| Path | What | Owned by |
| --- | --- | --- |
| `engine/` | Pinned copy of the Armature engine: role names, scales, accessibility rules, the build and its contrast checks | MIT licensed (see `engine/LICENSE`), usable by the client forever |
| `engine.lock.json` | Which engine commit and version this copy came from | |
| `client/owner.json` | Client name, package name, optional signatures of the client's own | The client |
| `client/families/<family>/family.json` | Palette, fonts, radius choice, light and dark themes, Android dynamic color policy. Most clients need one family (`main`); add more for distinct brands | The client |
| `client/apps/<app>.json` | Per app overrides (primary color, icon motif) when the client has several apps | The client |
| `client/dist/` | Generated outputs, never edited by hand | The client |

## Kickoff

1. Create the repo from this template, private, named `<client>-ds`.
2. In `client/owner.json` set the client's name and Android package.
3. Set `settings.industry` in each family (see the list in `engine/industries.json`; for example `["health"]`). The build then enforces that industry's rules and writes its guidelines to `client/docs/industry-rules.md`.
4. Replace the starter palette and fonts in `client/families/main/family.json` with the client's brand. Keep every role filled in light and dark.
5. Run `node engine/build.mjs client`. It refuses to build while any text is below 4.5:1 or any control boundary below 3:1; change colors until it passes.
6. Commit the source and `client/dist` together.

## Outputs

| Platform | File |
| --- | --- |
| Web (Tailwind v4 + shadcn/ui) | `client/dist/web/<target>.css` |
| Android (Jetpack Compose, Material 3) | `client/dist/android/<target>/ArmatureTheme.kt` |
| iOS (SwiftUI) | `client/dist/ios/<target>/Armature.swift` |
| Figma, agents | `client/dist/tokens/<target>.json` |
| Contrast and rules report | `client/docs/contrast-report.md` |
| Industry guidelines | `client/docs/industry-rules.md` |

## Updating the engine

```
node tools/update-engine.mjs main        # or a specific commit SHA
```

This replaces `engine/`, records the new commit in `engine.lock.json` and rebuilds. Review the diff in `client/dist` before committing. Updating is optional: a client repo keeps working on the engine it was built with.

## Handoff

Transfer the repo to the client's GitHub account (or send it as an archive). Everything under `client/` is theirs; the engine stays under MIT, so they can keep using and changing it.
