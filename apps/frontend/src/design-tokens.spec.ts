import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guards the WCAG AA contrast requirements of the shared visual identity by
 * reading the real tokens declared in `styles.css`.
 */

type Tokens = Record<string, string>;

interface ContrastPair {
  foreground: string;
  background: string;
  minimum: number;
  usage: string;
}

const TEXT = 4.5;
const NON_TEXT = 3;

/** Pairs actually used by the pages (dashboard, speaker and event forms) and the main menu. */
const PAIRS: ContrastPair[] = [
  // Text over surfaces
  { foreground: '--color-ink', background: '--color-surface', minimum: TEXT, usage: 'body text on card, menu link' },
  { foreground: '--color-ink', background: '--color-page', minimum: TEXT, usage: 'body text on page' },
  { foreground: '--color-ink', background: '--color-sand-soft', minimum: TEXT, usage: 'table header, GDE badge, success message' },
  { foreground: '--color-ink', background: '--color-accent-soft', minimum: TEXT, usage: 'text on error background' },
  { foreground: '--color-ink', background: '--color-mist', minimum: TEXT, usage: 'disabled button label' },
  { foreground: '--color-accent', background: '--color-surface', minimum: TEXT, usage: 'eyebrow, field error, secondary button, menu brand and current page' },
  { foreground: '--color-accent', background: '--color-page', minimum: TEXT, usage: 'accent text on page' },
  { foreground: '--color-accent', background: '--color-accent-soft', minimum: TEXT, usage: 'error message, secondary button and menu link hover' },
  // White text over filled buttons
  { foreground: '--color-surface', background: '--color-accent', minimum: TEXT, usage: 'primary button label' },
  { foreground: '--color-surface', background: '--color-ink', minimum: TEXT, usage: 'primary button hover label' },
  // Control borders and focus indicators
  { foreground: '--color-ink', background: '--color-surface', minimum: NON_TEXT, usage: 'field border' },
  { foreground: '--color-accent', background: '--color-surface', minimum: NON_TEXT, usage: 'focus outline, invalid field, secondary border, current page underline' },
  { foreground: '--color-accent', background: '--color-page', minimum: NON_TEXT, usage: 'focus outline on page' },
  { foreground: '--color-accent', background: '--color-accent-soft', minimum: NON_TEXT, usage: 'focus outline on hovered secondary button' },
];

function readStyles(): string {
  return readFileSync(join(__dirname, 'styles.css'), 'utf8');
}

function parseColorTokens(css: string): Tokens {
  const root = /:root\s*{([^}]*)}/.exec(css);
  if (!root) {
    throw new Error('styles.css must declare tokens in :root');
  }

  const tokens: Tokens = {};
  for (const [, name, value] of root[1].matchAll(
    /(--color-[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g
  )) {
    tokens[name] = value.toUpperCase();
  }
  return tokens;
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((offset) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [
    relativeLuminance(foreground),
    relativeLuminance(background),
  ].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function violations(tokens: Tokens): string[] {
  return PAIRS.flatMap(({ foreground, background, minimum, usage }) => {
    const ratio = contrastRatio(tokens[foreground], tokens[background]);
    return ratio >= minimum
      ? []
      : [`${foreground} on ${background} (${usage}): ${ratio.toFixed(2)} < ${minimum}`];
  });
}

describe('design tokens', () => {
  const tokens = parseColorTokens(readStyles());

  it('declares the palette and derived colors from design.md', () => {
    expect(tokens).toEqual({
      '--color-ink': '#4D4E49',
      '--color-accent': '#9B574A',
      '--color-sand': '#CFB079',
      '--color-mist': '#CAC6C3',
      '--color-surface': '#FFFFFF',
      '--color-page': '#EFEEED',
      '--color-sand-soft': '#F3EBDE',
      '--color-accent-soft': '#F5EEED',
    });
  });

  it('computes WCAG ratios matching the documented values', () => {
    expect(contrastRatio('#4D4E49', '#FFFFFF')).toBeCloseTo(8.39, 1);
    expect(contrastRatio('#9B574A', '#FFFFFF')).toBeCloseTo(5.45, 1);
    expect(contrastRatio('#CFB079', '#FFFFFF')).toBeCloseTo(2.07, 1);
    expect(contrastRatio('#CAC6C3', '#FFFFFF')).toBeCloseTo(1.7, 1);
  });

  it.each(PAIRS)(
    '$foreground on $background ($usage) reaches $minimum:1',
    ({ foreground, background, minimum }) => {
      expect(contrastRatio(tokens[foreground], tokens[background])).toBeGreaterThanOrEqual(
        minimum
      );
    }
  );

  it('fails when a text token is swapped for a color below the minimum', () => {
    const swapped = parseColorTokens(
      readStyles().replace(/(--color-ink\s*:\s*)#[0-9a-fA-F]{6}/, '$1#CFB079')
    );

    expect(violations(tokens)).toEqual([]);
    expect(violations(swapped).length).toBeGreaterThan(0);
    expect(violations(swapped)).toEqual(
      expect.arrayContaining([expect.stringContaining('--color-ink on --color-surface')])
    );
  });
});
