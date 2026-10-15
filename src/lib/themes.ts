/* GENERATED from odd/tasks/omarchy-theme.tokens.json - do not hand-edit.
 *
 * The 22 omarchy palettes, in switcher order, with the swatch colours each
 * one actually uses. Source: DESIGN-omarchy.md.
 */

export type ThemeMode = 'dark' | 'light';

export interface ThemeEntry {
  /** The [data-theme] value; must match src/styles/themes.css. */
  name: string;
  label: string;
  mode: ThemeMode;
  /** Swatch colours, used only to preview the palette in the switcher. */
  bg: string;
  brand: string;
}

export const THEMES: ThemeEntry[] = [
  { name: 'tokyo-night', label: 'Tokyo Night', mode: 'dark', bg: '#1a1b26', brand: '#9ece6a' },
  { name: 'catppuccin', label: 'Catppuccin', mode: 'dark', bg: '#1e1e2e', brand: '#89b4fa' },
  { name: 'catppuccin-latte', label: 'Catppuccin Latte', mode: 'light', bg: '#eff1f5', brand: '#1e66f5' },
  { name: 'ethereal', label: 'Ethereal', mode: 'dark', bg: '#060b1e', brand: '#7d82d9' },
  { name: 'everforest', label: 'Everforest', mode: 'dark', bg: '#2d353b', brand: '#7fbbb3' },
  { name: 'flexoki-light', label: 'Flexoki Light', mode: 'light', bg: '#fffcf0', brand: '#205ea6' },
  { name: 'gruvbox', label: 'Gruvbox', mode: 'dark', bg: '#282828', brand: '#7daea3' },
  { name: 'hackerman', label: 'Hackerman', mode: 'dark', bg: '#0b0c16', brand: '#82fb9c' },
  { name: 'kanagawa', label: 'Kanagawa', mode: 'dark', bg: '#1f1f28', brand: '#dcd7ba' },
  { name: 'last-horizon', label: 'Last Horizon', mode: 'dark', bg: '#0c0b0c', brand: '#b59790' },
  { name: 'lumon', label: 'Lumon', mode: 'dark', bg: '#16242d', brand: '#8bc9eb' },
  { name: 'lupine', label: 'Lupine', mode: 'light', bg: '#fafafa', brand: '#3264eb' },
  { name: 'matte-black', label: 'Matte Black', mode: 'dark', bg: '#121212', brand: '#e68e0d' },
  { name: 'miasma', label: 'Miasma', mode: 'dark', bg: '#222', brand: '#78824b' },
  { name: 'nord', label: 'Nord', mode: 'dark', bg: '#2e3440', brand: '#81a1c1' },
  { name: 'osaka-jade', label: 'Osaka Jade', mode: 'dark', bg: '#111c18', brand: '#509475' },
  { name: 'retro-82', label: 'Retro 82', mode: 'dark', bg: '#05182e', brand: '#faa968' },
  { name: 'ristretto', label: 'Ristretto', mode: 'dark', bg: '#2c2525', brand: '#f38d70' },
  { name: 'rose-pine', label: 'Rose Pine', mode: 'light', bg: '#faf4ed', brand: '#56949f' },
  { name: 'solitude', label: 'Solitude', mode: 'dark', bg: '#101315', brand: '#798186' },
  { name: 'vantablack', label: 'Vantablack', mode: 'dark', bg: '#000', brand: '#8d8d8d' },
  { name: 'white', label: 'White', mode: 'light', bg: '#fff', brand: '#6e6e6e' },
];

export const THEME_NAMES = THEMES.map((t) => t.name);

export const DARK_THEME_NAMES = THEMES.filter((t) => t.mode === 'dark').map((t) => t.name);
export const LIGHT_THEME_NAMES = THEMES.filter((t) => t.mode === 'light').map((t) => t.name);

/** localStorage key holding the chosen palette; also read by Base.astro. */
export const THEME_STORAGE_KEY = 'meperfolio-theme';