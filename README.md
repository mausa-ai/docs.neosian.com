# docs.neosian.com

The [neosian](https://github.com/mausa-ai/neosian) docs, rendered. The site
has one input: the neosian wheel at the release named in `RELEASE`. The
build downloads that wheel from PyPI, checks its sha256, and renders the
pages `neosian docs <topic>` prints — plus `llms.txt`, byte-identical at
`/llms.txt`. Nothing is authored here; a correction to a page is a pull
request to `neosian/assets/docs/` in the library.

```bash
npm ci
npm run build      # fetch the wheel, render, astro build → dist/
npm run dev        # the same, then a dev server
```

A new release is one line: bump `RELEASE`, push `main`, and the deploy
workflow uploads `dist/` to Cloudflare Pages. Pull requests build and stop.

Astro + Starlight, exact pins. The brand file `src/styles/brand.css` is
the library's `branding/README.md` ladder and is kept identical to the one
in the neosian.com repository. Later: the blog as markdown in Git.

Apache-2.0. Maintainers read **community@neosian.com**.
