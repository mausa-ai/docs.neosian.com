// The site's only input: the neosian wheel at the release RELEASE names.
// PyPI's JSON names the wheel and its sha256; the digest is checked before
// anything is unzipped, and only the docs pages and llms.txt come out.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const release = readFileSync("RELEASE", "utf8").trim();
const meta = await fetch(`https://pypi.org/pypi/neosian/${release}/json`);
if (!meta.ok) throw new Error(`PyPI has no neosian ${release}: ${meta.status}`);
const wheel = (await meta.json()).urls.find((u) => u.packagetype === "bdist_wheel");
if (!wheel) throw new Error(`neosian ${release} has no wheel on PyPI`);

const bytes = Buffer.from(await (await fetch(wheel.url)).arrayBuffer());
const digest = createHash("sha256").update(bytes).digest("hex");
if (digest !== wheel.digests.sha256) throw new Error(`sha256 mismatch for ${wheel.filename}`);

rmSync("build/wheel", { recursive: true, force: true });
mkdirSync("build/wheel", { recursive: true });
writeFileSync(`build/${wheel.filename}`, bytes);
execFileSync("unzip", [
  "-q", "-o", `build/${wheel.filename}`,
  "neosian/assets/docs/*", "neosian/assets/llms.txt",
  "neosian/_foundation/shared/docs_assets.py",
  "-d", "build/wheel",
]);
console.log(`neosian ${release}: ${wheel.filename} (${bytes.length} bytes, sha256 ok)`);
