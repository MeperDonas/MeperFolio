/**
 * Per-technology accent, derived from the active palette instead of a fixed hex
 * list.
 *
 * The old version handed out six curated hex hues, so a chip ignored whatever
 * theme was on screen and certifications picked an accent unrelated to it. Here
 * the brand's hue is rotated by a stable per-name step: stacks stay
 * distinguishable while every chip still belongs to the current palette, and a
 * palette swap moves the chips with it.
 *
 * Relative colour syntax stores the expression as-is in `--tag-accent`. Where
 * `oklch(from ...)` is unsupported the custom property becomes invalid at
 * computed-value time, and every consumer already reads it through
 * `var(--tag-accent, var(--color-primary))`, so the chip falls back to the brand
 * colour rather than losing its styling.
 */
const HUE_STEPS = [34, -30, 68, -64, 102, -98, 136] as const;

export function tagHue(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const step = HUE_STEPS[hash % HUE_STEPS.length];
  return `oklch(from var(--color-primary) l c calc(h + ${step}))`;
}
