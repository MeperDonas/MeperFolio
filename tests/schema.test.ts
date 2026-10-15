import { describe, expect, it } from 'vitest';
import {
  aboutSchema,
  certificationsSchema,
  experienceSchema,
  pluginsSchema,
  projectsSchema,
  siteSchema,
} from '../src/content/schemas';

describe('content schemas', () => {
  it('accepts a valid experience entry with an end date', () => {
    const result = experienceSchema.safeParse({
      role: 'Frontend Developer',
      company: 'Acme Corp',
      start: '2020-01',
      end: '2022-06',
      tags: ['React', 'TypeScript'],
    });

    expect(result.success).toBe(true);
  });

  it('accepts an experience entry with no end date (current role)', () => {
    const result = experienceSchema.safeParse({
      role: 'Frontend Developer',
      company: 'Acme Corp',
      start: '2023-01',
      tags: ['React'],
    });

    expect(result.success).toBe(true);
  });

  it('rejects an experience entry missing the required role', () => {
    const result = experienceSchema.safeParse({
      company: 'Acme Corp',
      start: '2020-01',
      tags: [],
    });

    expect(result.success).toBe(false);
  });

  it('rejects an experience entry with a non-string tag', () => {
    const result = experienceSchema.safeParse({
      role: 'Frontend Developer',
      company: 'Acme Corp',
      start: '2020-01',
      tags: ['React', 42],
    });

    expect(result.success).toBe(false);
  });

  it('accepts a valid project entry with a URL', () => {
    const result = projectsSchema.safeParse({
      title: 'Portfolio',
      description: 'Personal site',
      stack: ['Astro', 'Tailwind'],
      url: 'https://example.com',
    });

    expect(result.success).toBe(true);
  });

  it('keeps the logo slug on a project entry so the card can resolve its cover', () => {
    const result = projectsSchema.safeParse({
      title: 'Meper-Pos',
      description: 'Inventory app',
      stack: ['Next.js'],
      logo: 'meperpos',
    });

    expect(result.success).toBe(true);
    expect(result.data?.logo).toBe('meperpos');
  });

  it('keeps the repository behind the card GitHub button separate from the site url', () => {
    const result = projectsSchema.safeParse({
      title: 'Meper-Pos',
      description: 'Inventory app',
      stack: ['Next.js'],
      url: 'https://gestion-inventario-app-navy.vercel.app',
      repo: 'https://github.com/MeperDonas/MeperPOS',
    });

    expect(result.success).toBe(true);
    expect(result.data?.repo).toBe('https://github.com/MeperDonas/MeperPOS');
    expect(result.data?.url).toBe('https://gestion-inventario-app-navy.vercel.app');
  });

  it('leaves the logo undefined when a project has no cover asset', () => {
    const result = projectsSchema.safeParse({
      title: 'Vidmetrics',
      description: 'Metrics dashboard',
      stack: ['Next.js'],
    });

    expect(result.success).toBe(true);
    expect(result.data?.logo).toBeUndefined();
  });

  it('rejects a project entry with an invalid URL', () => {
    const result = projectsSchema.safeParse({
      title: 'Portfolio',
      description: 'Personal site',
      stack: ['Astro'],
      url: 'not-a-url',
    });

    expect(result.success).toBe(false);
  });

  it('accepts a valid site entry with contact links and nav labels', () => {
    const result = siteSchema.safeParse({
      name: 'Jane Doe',
      role: 'Frontend Developer',
      email: 'jane@example.com',
      linkedin: 'https://linkedin.com/in/jane',
      github: 'https://github.com/jane',
      nav: {
        about: 'About',
        experience: 'Experience',
        projects: 'Projects',
        certifications: 'Certifications',
        plugins: 'Plugins',
        contact: 'Contact',
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects a site entry with an invalid email', () => {
    const result = siteSchema.safeParse({
      name: 'Jane Doe',
      role: 'Frontend Developer',
      email: 'not-an-email',
      linkedin: 'https://linkedin.com/in/jane',
      github: 'https://github.com/jane',
      nav: {
        about: 'About',
        experience: 'Experience',
        projects: 'Projects',
        certifications: 'Certifications',
        plugins: 'Plugins',
        contact: 'Contact',
      },
    });

    expect(result.success).toBe(false);
  });

  it('accepts a valid about entry', () => {
    const result = aboutSchema.safeParse({
      title: 'About',
      lead: 'Hi, I build things for the web.',
    });

    expect(result.success).toBe(true);
  });

  it('accepts a valid certification entry', () => {
    const result = certificationsSchema.safeParse({
      title: 'AWS Certified Developer',
      issuer: 'Amazon',
      date: '2023-05',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a certification entry missing the issuer', () => {
    const result = certificationsSchema.safeParse({
      title: 'AWS Certified Developer',
      date: '2023-05',
    });

    expect(result.success).toBe(false);
  });

  it('accepts a valid plugin entry with a repository and a version', () => {
    const result = pluginsSchema.safeParse({
      title: 'devstack',
      description: 'Local dev stacks in one bar icon.',
      version: '1.10.3',
      kind: 'bar-widget',
      repo: 'https://github.com/MeperDonas/omarchy-devstack',
    });

    expect(result.success).toBe(true);
  });

  it('keeps the preview path on a plugin entry so the card can resolve its cover', () => {
    const result = pluginsSchema.safeParse({
      title: 'devstack',
      description: 'Local dev stacks in one bar icon.',
      version: '1.10.3',
      kind: 'bar-widget',
      repo: 'https://github.com/MeperDonas/omarchy-devstack',
      preview: '/plugins/devstack.png',
    });

    expect(result.success).toBe(true);
    expect(result.data?.preview).toBe('/plugins/devstack.png');
  });

  it('keeps the manifest id on a plugin entry for the registry-style card', () => {
    const result = pluginsSchema.safeParse({
      title: 'devstack',
      description: 'Local dev stacks in one bar icon.',
      version: '1.10.3',
      kind: 'bar-widget',
      repo: 'https://github.com/MeperDonas/omarchy-devstack',
      id: 'meperdonas.devstack',
    });

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('meperdonas.devstack');
  });

  it('rejects a plugin entry whose repository is not a URL', () => {
    const result = pluginsSchema.safeParse({
      title: 'devstack',
      description: 'Local dev stacks in one bar icon.',
      version: '1.10.3',
      kind: 'bar-widget',
      repo: 'MeperDonas/omarchy-devstack',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a site entry whose nav omits the plugins label', () => {
    const result = siteSchema.safeParse({
      name: 'Jane Doe',
      role: 'Frontend Developer',
      email: 'jane@example.com',
      linkedin: 'https://linkedin.com/in/jane',
      github: 'https://github.com/jane',
      nav: {
        about: 'About',
        experience: 'Experience',
        projects: 'Projects',
        certifications: 'Certifications',
        contact: 'Contact',
      },
    });

    expect(result.success).toBe(false);
  });
});
