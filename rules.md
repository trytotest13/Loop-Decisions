# Rules: Jev Loop Decisions

## Language
- JavaScript ES2022, CommonJS, Node 18+. JSDoc types on exported functions.
  JSDoc `*` is banned unless a comment justifies it.

## Style
- 2-space indent, semicolons, single quotes, camelCase, kebab-case filenames.
- Imports: node builtins first, then lib.
- Banned: `var`, `eval`, `console.log` in lib/, inline event handlers in HTML.

## Errors
- Every fetch has visible loading, error, and empty states.
- Server returns typed JSON errors, never stack traces.
- Validate and size-cap request bodies (1 MB). Budget clamped to 200..100000.

## Motion
- The staggered step reveal is the only animation, runs once per simulation,
  and is disabled under prefers-reduced-motion. No looping motion anywhere.

## Secrets
- Never hardcode keys or tokens. Only `.env.example` with placeholders
  commits; `.env` is gitignored. Rotate immediately if anything leaks.

## Docs
- Update todo.md after every task. design.md tokens are authoritative.
