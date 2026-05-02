/**
 * StatusBar — slim ~48px top bar that persists on every anaf page.
 *
 * Layout (per task spec §D):
 *   left:  inlined onegov logo (28px tall) + dot + muted "pe **anaf.ro**"
 *   right: density chip (Minimal / Simplu / Bogat) + show-original ✕ button
 *
 * White background, subtle bottom border. NOT the heavy blue strip.
 *
 * Composes from `@onegov/ui`: `Cluster`, `Inline`, `Text`, `Button`. The
 * density chip is a small Cluster of 3 buttons that rotate `runtime.density`
 * when clicked — keep it as a single inline group, not a dropdown.
 */

import { Cluster, Inline, Text, Button } from '@onegov/ui';
import type { SiteRuntime, Density } from '../types.js';

interface Props {
  runtime: SiteRuntime;
}

const DENSITY_LABELS: Record<Density, string> = {
  minimal: 'Minimal',
  simplu: 'Simplu',
  bogat: 'Bogat',
};

const DENSITY_ORDER: ReadonlyArray<Density> = ['minimal', 'simplu', 'bogat'];

export function StatusBar({ runtime }: Props) {
  return (
    <div class="anaf-statusbar" role="banner">
      <div class="anaf-statusbar__inner">
        <Cluster gap="md" justify="between" class="anaf-statusbar__row">
          <Inline class="anaf-statusbar__brand">
            <span class="anaf-statusbar__logo" aria-label="onegov">
              {LOGO_SVG}
            </span>
            <span class="anaf-statusbar__sep" aria-hidden="true">·</span>
            <Text size="sm" tone="muted">
              pe <strong>anaf.ro</strong>
            </Text>
          </Inline>
          <Cluster gap="sm" class="anaf-statusbar__actions">
            <DensityChip current={runtime.density} onPick={runtime.setDensity} />
            <Button
              variant="ghost"
              size="sm"
              onClick={runtime.showOriginal}
              aria-label="Afișează site-ul original anaf.ro"
            >
              afișează site original
            </Button>
          </Cluster>
        </Cluster>
      </div>
    </div>
  );
}

interface ChipProps {
  current: Density;
  onPick: (next: Density) => void;
}

function DensityChip({ current, onPick }: ChipProps) {
  return (
    <div
      class="anaf-density-chip"
      role="radiogroup"
      aria-label="Densitate interfață"
    >
      {DENSITY_ORDER.map((d) => {
        const selected = d === current;
        return (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={selected}
            class={`anaf-density-chip__option${selected ? ' anaf-density-chip__option--selected' : ''}`}
            onClick={() => onPick(d)}
          >
            {DENSITY_LABELS[d]}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Inlined onegov logo (mark only, blue) — drawn at 28px tall in the
 * statusbar. Same path as the loader splash but without the wordmark so
 * it fits the slim bar.
 */
const LOGO_SVG = (
  <svg
    width="28"
    height="28"
    viewBox="0 0 66 66"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect width="66" height="66" rx="20" ry="20" style="fill:#1a498f" />
    <path
      d="M23.34,17.75c-8.11,0-13.77,6.37-13.77,15.5s5.49,14.99,13.35,14.99c3.83,0,7.29-1.42,9.74-4,2.64-2.78,4.04-6.77,4.04-11.55,0-8.94-5.37-14.95-13.35-14.95ZM23.13,44.07c-4.08,0-8.46-3.41-8.46-10.9,0-5.6,2.63-11.24,8.5-11.24,4.08,0,8.46,3.43,8.46,10.95s-4.27,11.2-8.5,11.2Z"
      style="fill:#fff"
    />
    <path
      d="M45.9,31.69v4.13h5.77v7.48c-.94.35-2.5.55-4.29.55-6.39,0-10.36-4.16-10.36-10.86s4.15-10.82,10.82-10.82c3.01,0,4.81.63,6.03,1.17l.62.27,1.22-4.12-.45-.22c-1.37-.66-4.01-1.36-7.33-1.36-9.5,0-15.92,6.13-15.96,15.25,0,4.45,1.51,8.46,4.14,11,2.76,2.63,6.36,3.91,11.02,3.91,3.7,0,6.89-.87,8.92-1.59l.39-.14v-14.65h-10.53Z"
      style="fill:#fff"
    />
    <ellipse cx="22.94" cy="33.26" rx="5.3" ry="7.42" style="fill:#fff" />
  </svg>
);
