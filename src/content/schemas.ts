import { z } from 'astro/zod';

// Raw Zod schemas for Astro content collections, extracted from config.ts so
// unit tests can import them without touching the `astro:content` module
// (which has no meaning outside the Astro runtime).

/** Shared shape for an optional external URL (used by projects + certifications). */
const optionalUrl = z.string().url().optional();

export const aboutSchema = z.object({
  title: z.string(),
  lead: z.string(),
});

export const experienceSchema = z.object({
  role: z.string(),
  company: z.string(),
  start: z.string(),
  end: z.string().optional(),
  tags: z.array(z.string()),
});

export const projectsSchema = z.object({
  title: z.string(),
  description: z.string(),
  stack: z.array(z.string()),
  url: optionalUrl,
  /**
   * Slug of the app's brand folder under `public/apps/` (see the MeperSoft brand
   * pack). Drives the card cover; omitted when an app has no assets yet, and the
   * card then falls back to a monogram.
   */
  logo: z.string().optional(),
  /**
   * Repository behind the card's GitHub button. Separate from `url` on purpose:
   * `url` can be a live site, and a private repository must be left out rather
   * than linked into a 404.
   */
  repo: z.string().url().optional(),
});

/**
 * An Omarchy plugin (bar widget). `repo` is required because publishing is the
 * point of this section; `url` stays optional for a future marketplace page.
 */
export const pluginsSchema = z.object({
  title: z.string(),
  description: z.string(),
  version: z.string(),
  kind: z.string(),
  repo: z.string().url(),
  url: optionalUrl,
  /** Screenshot shown as the card cover, as in the Omarchy plugin registry. */
  preview: z.string().optional(),
  /** The plugin's own `manifest.json` id, shown as the registry reference. */
  id: z.string().optional(),
});

export const certificationsSchema = z.object({
  title: z.string(),
  issuer: z.string(),
  date: z.string(),
  url: optionalUrl,
});

export const siteSchema = z.object({
  name: z.string(),
  role: z.string(),
  email: z.string().email(),
  linkedin: z.string().url(),
  github: z.string().url(),
  cv: z.string().optional(),
  nav: z.object({
    about: z.string(),
    experience: z.string(),
    projects: z.string(),
    certifications: z.string(),
    plugins: z.string(),
    contact: z.string(),
  }),
});
