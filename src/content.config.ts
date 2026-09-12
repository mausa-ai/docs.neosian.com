import { defineCollection } from "astro:content";
import { docsLoader, i18nLoader } from "@astrojs/starlight/loaders";
import { docsSchema, i18nSchema } from "@astrojs/starlight/schema";

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  // One string overridden: the footer link points at the wheel, not here.
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
};
