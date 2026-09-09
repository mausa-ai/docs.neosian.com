// build/wheel → the Starlight content tree. Nothing is authored here: each
// page's frontmatter becomes Starlight's, the H1 the wheel prints goes
// (Starlight renders the title), the order is the wheel's own manifest:
// a page it lists but does not carry, or carries but does not list, fails.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, copyFileSync } from "node:fs";

const release = readFileSync("RELEASE", "utf8").trim();
const wheel = "build/wheel/neosian";
const manifest = readFileSync(`${wheel}/_foundation/shared/docs_assets.py`, "utf8");
const tuple = /_TOPICS: Final = \(([^)]*)\)/.exec(manifest);
if (!tuple) throw new Error("docs_assets.py carries no _TOPICS tuple");
const topics = [...tuple[1].matchAll(/"([a-z]+)"/g)].map((m) => m[1]);
const onDisk = readdirSync(`${wheel}/assets/docs`).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3));
const missing = topics.filter((t) => !onDisk.includes(t));
const unlisted = onDisk.filter((t) => !topics.includes(t));
if (missing.length || unlisted.length) {
  throw new Error(`manifest mismatch: missing: ${missing}, unlisted: ${unlisted}`);
}

const out = "src/content/docs";
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const pages = topics.map((topic) => {
  const text = readFileSync(`${wheel}/assets/docs/${topic}.md`, "utf8");
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!fm) throw new Error(`${topic}.md has no frontmatter`);
  const field = (key) => {
    const m = new RegExp(`^${key}: (.*)$`, "m").exec(fm[1]);
    if (!m) throw new Error(`${topic}.md has no ${key}`);
    return m[1].trim();
  };
  const title = field("title");
  const summary = field("summary");
  const body = text.slice(fm[0].length).replace(/^\s*# .*\n/, "");
  const head = `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(summary)}\n---\n\n`;
  writeFileSync(`${out}/${topic}.md`, head + body);
  return { topic, title, summary };
});

const listing = pages.map((p) => `- [${p.title}](/${p.topic}/): ${p.summary}`).join("\n");
writeFileSync(
  `${out}/index.md`,
  `---
title: "neosian docs"
description: "The pages that ship in the neosian wheel, rendered for release ${release}"
---

These are the pages \`neosian docs <topic>\` prints from the installed wheel,
rendered here for **neosian ${release}**: the same bytes, so they always
describe the release they came with. Nothing is authored on this site:
a correction is a pull request to
[mausa-ai/neosian](https://github.com/mausa-ai/neosian/tree/master/neosian/assets/docs).

${listing}

Agents start at [llms.txt](/llms.txt), the machine-readable front door
(byte-identical to the wheel's copy). The library is on
[PyPI](https://pypi.org/project/neosian/) and
[GitHub](https://github.com/mausa-ai/neosian); \`neosian.com\` is the front
door for people.
`,
);
copyFileSync(`${wheel}/assets/llms.txt`, "public/llms.txt");
writeFileSync("build/order.json", JSON.stringify(pages.map(({ topic, title }) => ({ topic, title }))));
console.log(`rendered ${pages.length} pages + index + llms.txt for ${release}`);
