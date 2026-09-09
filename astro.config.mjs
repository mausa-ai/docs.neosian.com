// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { readFileSync } from "node:fs";

// The sidebar is the wheel's reading order (scripts/render.mjs writes it).
const order = JSON.parse(readFileSync("build/order.json", "utf8"));
const release = readFileSync("RELEASE", "utf8").trim();

export default defineConfig({
  site: "https://docs.neosian.com",
  integrations: [
    starlight({
      title: "neosian",
      description: `neosian ${release} — the state layer for LLM agents`,
      logo: {
        light: "./src/assets/logo-light.svg",
        dark: "./src/assets/logo-dark.svg",
        replacesTitle: true,
        alt: "neosian",
      },
      favicon: "/favicon.svg",
      customCss: ["./src/styles/brand.css"],
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/mausa-ai/neosian" },
        { icon: "seti:python", label: "PyPI", href: "https://pypi.org/project/neosian/" },
      ],
      sidebar: [
        { label: `neosian ${release}`, link: "/" },
        ...order.map(({ topic, title }) => ({ label: title, link: `/${topic}/` })),
        { label: "llms.txt", link: "/llms.txt" },
      ],
      lastUpdated: false,
      credits: false,
    }),
  ],
});
