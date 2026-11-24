# AGENTS.md

Public collection of agent skills, installable as one plugin `skill-soup` in Claude Code
and Codex. The README states the conventions for names, language, boundaries, layout,
configuration and versioning. Read it before you change a skill.

- Skills are copied here from a private upstream repository. A change made only here is
  overwritten by the next copy. Fix skills upstream, then copy again.
- Every change passes `just check` before it is committed. Run `npm install` once for the
  type check. Scripts are TypeScript run by Node 22.18+ without a build step.
- A shipped change raises the Codex version (`just bump patch|minor|major`) and adds the
  matching section to `CHANGELOG.md`. Never add a `version` to `.claude-plugin/plugin.json`.
- Commit messages: Conventional Commits in English, scope = skill name.
