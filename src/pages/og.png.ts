import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import type { APIRoute } from 'astro';
import { getSite } from '../lib/content';

/**
 * Social preview card (1200×630 PNG) rendered at build time with Satori.
 *
 * A static build artifact cannot follow the runtime theme, so it is pinned to
 * the tokyo-night palette and the mono headline voice from DESIGN-omarchy.md.
 * Fonts come from the Fontsource CDN (TTF); falls back to Inter if the mono or
 * Geist faces are unavailable.
 */

type StyleProps = Record<string, string | number>;
interface TreeNode {
  type: string;
  props: { style?: StyleProps; children?: string | TreeNode | TreeNode[] };
}

type FontPkg = 'jetbrains-mono' | 'geist' | 'inter';
const FONT_FAMILY: Record<FontPkg, string> = {
  'jetbrains-mono': 'JetBrains Mono',
  geist: 'Geist',
  inter: 'Inter',
};

async function fetchFont(pkg: FontPkg, weight: 400 | 600): Promise<{ name: string; data: ArrayBuffer; weight: number }> {
  const url = `https://cdn.jsdelivr.net/fontsource/fonts/${pkg}@latest/latin-${weight}-normal.ttf`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font fetch failed (${res.status}): ${url}`);
  return { name: FONT_FAMILY[pkg], data: await res.arrayBuffer(), weight };
}

// tokyo-night palette, the block that sits at :root in src/styles/themes.css.
const T = {
  bg: '#1a1b26',
  brand: '#9ece6a',
  ink: '#c0caf5',
  inkMuted: '#a9b1d6',
  inkSubtle: '#8b93b8',
  borderStrong: '#414868',
};

function ogTree(name: string, role: string, head: string, body: string): TreeNode {
  return {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px',
        backgroundColor: T.bg,
        fontFamily: body,
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', gap: '14px' },
            children: [
              { type: 'div', props: { style: { display: 'flex', width: '30px', height: '2px', backgroundColor: T.brand } } },
              { type: 'div', props: { style: { color: T.inkSubtle, fontSize: '22px', letterSpacing: '4px', textTransform: 'uppercase' }, children: role } },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: { color: T.ink, fontFamily: head, fontSize: '88px', fontWeight: 600, letterSpacing: '-2px', lineHeight: 1.05 },
            children: name,
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '32px' },
            children: [
              {
                type: 'div',
                props: {
                  style: { color: T.inkMuted, fontSize: '26px', lineHeight: 1.4, maxWidth: '700px' },
                  children: 'Portfolio personal · Proyectos, experiencia y certificaciones.',
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    padding: '12px 26px',
                    border: `1px solid ${T.borderStrong}`,
                    borderRadius: '9999px',
                    color: T.inkSubtle,
                    fontSize: '21px',
                  },
                  children: 'meperfolio.vercel.app',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

export const GET: APIRoute = async () => {
  const site = (await getSite('es'))[0].data;

  type SatoriFont = { name: string; data: ArrayBuffer; weight: number };
  let fonts: SatoriFont[];
  let head = FONT_FAMILY['jetbrains-mono'];
  let body = FONT_FAMILY.geist;
  try {
    fonts = await Promise.all([
      fetchFont('jetbrains-mono', 600),
      fetchFont('geist', 400),
      fetchFont('geist', 600),
    ]);
  } catch {
    fonts = await Promise.all([fetchFont('inter', 400), fetchFont('inter', 600)]);
    head = FONT_FAMILY.inter;
    body = FONT_FAMILY.inter;
  }

  // Satori's own typings assume a JSX runtime; at runtime a plain tree works.
  const renderSatori = satori as (node: unknown, options: { width: number; height: number; fonts: SatoriFont[] }) => Promise<string>;
  const svg = await renderSatori(ogTree(site.name, site.role, head, body), { width: 1200, height: 630, fonts });

  const png = new Resvg(svg).render().asPng();
  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  });
};
