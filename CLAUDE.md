# Project Conventions

- In TypeScript, use `VoidFunction` instead of writing out `() => void`.
- In `interface` declarations, add a one-line comment above each field explaining what it holds.
- Comments must be 1-3 lines maximum. If it needs more, it belongs in a doc, not a comment block.
- Never wildcard-import a package (`import * as X from "pkg"`) — import only the named members actually used.
- Every `await` must be wrapped in `try/catch`.
- Commits and PRs must show no sign of AI involvement — no `Co-Authored-By` trailer, no "Generated with Claude Code" footer.
