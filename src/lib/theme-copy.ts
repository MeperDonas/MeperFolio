/**
 * Hand-authored copy for the theme switcher.
 *
 * `src/lib/themes.ts` is generated from the palette token table and owns the
 * colours; this file owns the words, because a human has to describe what each
 * palette actually looks like. Every descriptor is derived from that palette's
 * real `--t-bg` and `--t-brand` values (see odd/tasks/omarchy-theme.tokens.json)
 * rather than invented, so the label never promises a colour the palette lacks.
 *
 * Both locales are authored here; the switcher renders each as a `[data-locale]`
 * span, so the existing i18n script in scripts/app.ts swaps them for free.
 */

export interface ThemeCopy {
  es: string;
  en: string;
}

/** Short "background · accent" descriptor per palette name. */
export const THEME_DESCRIPTIONS: Record<string, ThemeCopy> = {
  catppuccin: { es: 'Ciruela suave · azul pastel', en: 'Soft plum · pastel blue' },
  'catppuccin-latte': { es: 'Blanco frío · azul vivo', en: 'Cool white · vivid blue' },
  ethereal: { es: 'Azul noche · periwinkle', en: 'Deep navy · periwinkle' },
  everforest: { es: 'Pizarra verde · salvia', en: 'Green slate · sage' },
  'flexoki-light': { es: 'Papel cálido · azul tinta', en: 'Warm paper · ink blue' },
  gruvbox: { es: 'Gris cálido · verde teal', en: 'Warm grey · muted teal' },
  hackerman: { es: 'Casi negro · verde neón', en: 'Near black · neon green' },
  kanagawa: { es: 'Tinta japonesa · beige', en: 'Sumi ink · beige' },
  'last-horizon': { es: 'Negro cálido · rosa topo', en: 'Warm black · rose taupe' },
  lumon: { es: 'Petróleo oscuro · azul hielo', en: 'Deep petrol · ice blue' },
  lupine: { es: 'Blanco puro · azul franco', en: 'Pure white · strong blue' },
  'matte-black': { es: 'Negro mate · ámbar naranja', en: 'Matte black · amber orange' },
  miasma: { es: 'Carbón · verde oliva', en: 'Charcoal · olive green' },
  nord: { es: 'Pizarra nórdica · azul frost', en: 'Nordic slate · frost blue' },
  'osaka-jade': { es: 'Negro jade · verde jade', en: 'Jade black · jade green' },
  'retro-82': { es: 'Azul profundo · damasco', en: 'Deep blue · apricot' },
  ristretto: { es: 'Café tostado · coral', en: 'Roasted coffee · coral' },
  'rose-pine': { es: 'Papel rosado · teal', en: 'Rose paper · teal' },
  solitude: { es: 'Grafito · gris acero', en: 'Graphite · steel grey' },
  'tokyo-night': { es: 'Índigo nocturno · verde lima', en: 'Night indigo · lime green' },
  vantablack: { es: 'Negro puro · gris neutro', en: 'Pure black · neutral grey' },
  white: { es: 'Blanco puro · gris', en: 'Pure white · grey' },
};

/** Words for the palette kind, shown next to each swatch. */
export const MODE_LABELS: Record<'dark' | 'light', ThemeCopy> = {
  dark: { es: 'Oscuro', en: 'Dark' },
  light: { es: 'Claro', en: 'Light' },
};

/** Heading of the switcher panel. */
export const SWITCHER_TITLE: ThemeCopy = { es: 'Paletas de tema', en: 'Theme palettes' };

/** Accessible name and short prefix of the toggle itself. */
export const SWITCHER_LABEL: ThemeCopy = { es: 'Tema', en: 'Theme' };

/** Title attribute of the back-to-top control. */
export const BACK_TO_TOP_LABEL: ThemeCopy = { es: 'Volver arriba', en: 'Back to top' };
