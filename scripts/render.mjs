// build/wheel → the Starlight content tree. Nothing is authored here: each
// page's frontmatter becomes Starlight's, the H1 the wheel prints goes
// (Starlight renders the title), the order is the wheel's own manifest:
// a page it lists but does not carry, or carries but does not list, fails.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, copyFileSync } from "node:fs";

const release = readFileSync("RELEASE", "utf8").trim();
const wheel = "build/wheel/neosian";
// Every page links at the bytes it was rendered from, in the repo that
// owns them: this site authors nothing, so "edit" means edit the wheel.
const SOURCE =
  "https://github.com/mausa-ai/neosian/blob/master/neosian/assets/docs";
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

// Brackets drawn around the wheel's reading order, never a reordering of
// it: flattened, GROUPS must be the manifest, so a page the wheel gains
// fails the build here until it is placed. A null label means bare links.
const GROUPS = [
  { label: null, topics: ["quickstart"] },
  { label: "The core", topics: ["agent", "local", "tools"] },
  { label: "The state", topics: ["memory", "skills"] },
  { label: "The doors", topics: ["cli", "mcp", "agents"] },
  { label: "Reference", topics: ["topology", "wire", "baselines"] },
];
const grouped = GROUPS.flatMap((g) => g.topics);
if (grouped.join() !== topics.join()) {
  throw new Error(`GROUPS is not the manifest: ${grouped} vs ${topics}`);
}

// A frontmatter scalar carrying a `: ` is quoted (real YAML, as the wheel
// writes it); the quotes are syntax, not title text.
const unquote = (value) => {
  if (value.length > 1 && value.startsWith('"') && value.endsWith('"')) {
    return JSON.parse(value);
  }
  if (value.length > 1 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replaceAll("''", "'");
  }
  return value;
};

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
    return unquote(m[1].trim());
  };
  const title = field("title");
  const summary = field("summary");
  // `Name: the gloss` is the wheel's title shape; the name alone is the
  // sidebar label, the whole of it stays the H1 and the <title>.
  const label = title.split(": ")[0];
  const body = text.slice(fm[0].length).replace(/^\s*# .*\n/, "");
  const head =
    `---\ntitle: ${JSON.stringify(title)}\n` +
    `description: ${JSON.stringify(summary)}\n` +
    `editUrl: ${JSON.stringify(`${SOURCE}/${topic}.md`)}\n---\n\n`;
  writeFileSync(`${out}/${topic}.md`, head + body);
  return { topic, title, label, summary };
});

// The index is a splash: the mark, the one thing to know about these
// bytes, and the pages as cards. The cards are raw HTML rather than
// Starlight's <CardGrid>, which would cost an MDX integration for one
// grid; src/styles/docs.css dresses them.
const escape = (t) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cards = pages
  .map(
    (p) =>
      `  <a class="topic" href="/${p.topic}/">\n` +
      `    <span class="topic-name">${escape(p.label)}</span>\n` +
      `    <span class="topic-summary">${escape(p.summary)}</span>\n` +
      `  </a>`,
  )
  .join("\n");
writeFileSync(
  `${out}/index.md`,
  `---
title: "neosian docs"
description: "The pages that ship in the neosian wheel, rendered for release ${release}"
template: splash
hero:
  tagline: "<code>neosian docs &lt;topic&gt;</code> prints these pages from the installed wheel. Rendered here for ${release}: the same bytes, so they always describe the release they came with."
  image:
    file: ../../assets/mark.svg
  actions:
    - text: Quickstart
      link: /quickstart/
      icon: right-arrow
      variant: primary
    - text: llms.txt
      link: /llms.txt
      icon: document
      variant: minimal
---

<div class="topics">
${cards}
</div>

Nothing is authored on this site: a correction is a pull request to
[mausa-ai/neosian](https://github.com/mausa-ai/neosian/tree/master/neosian/assets/docs).
Agents start at [llms.txt](/llms.txt), the machine-readable front door
(byte-identical to the wheel's copy). The library is on
[PyPI](https://pypi.org/project/neosian/) and
[GitHub](https://github.com/mausa-ai/neosian); \`neosian.com\` is the front
door for people.
`,
);
copyFileSync(`${wheel}/assets/llms.txt`, "public/llms.txt");
const byTopic = Object.fromEntries(pages.map((p) => [p.topic, p]));
writeFileSync(
  "build/order.json",
  JSON.stringify(
    GROUPS.map(({ label, topics: group }) => ({
      label,
      items: group.map((t) => ({ topic: t, label: byTopic[t].label })),
    })),
  ),
);
console.log(`rendered ${pages.length} pages + index + llms.txt for ${release}`);
