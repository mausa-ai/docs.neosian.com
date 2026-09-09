# docs.neosian.com — conventions

- **The input is the wheel.** `scripts/fetch-wheel.mjs` downloads
  neosian at `RELEASE` from PyPI and checks the digest; `scripts/render.mjs`
  turns its docs pages and `llms.txt` into the Starlight tree. No page is
  authored in this repository — a docs change is a pull request to
  `mausa-ai/neosian` (`neosian/assets/docs/`).
- **The order is the wheel's manifest** (`_TOPICS`); a mismatch fails the
  build rather than hiding a page.
- **Exact pins** in `package.json`; Dependabot proposes bumps. Actions are
  SHA-pinned with their version in a comment.
- **The gate** is `npm run build`. The deploy is a push to `main`.
- `src/styles/brand.css` is identical to the neosian.com copy — change both.
