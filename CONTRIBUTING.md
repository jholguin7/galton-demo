# Contributing — Tweaking the Galton Prototype

Quick reference for iterating on the prototype: changing mock numbers, tweaking charts, adjusting styling.

## File map

| File | Purpose |
|------|---------|
| `index.html` | Entry point. Loads React + Babel from CDN, defines the `:root` CSS tokens (colors, liquid-glass variables), includes the JSX files. |
| `app-v2.jsx` | **Main app.** Mock data, sidebar, header, KPI tiles, panel layouts. **This is where most edits go.** |
| `charts-v2.jsx` | `LineChart` (dotted line + glow) and `StackedBars` chart primitives. |
| `charts.jsx` | Legacy chart from v1 (not used on current dashboard, safe to ignore). |
| `tweaks-panel.jsx` | Runtime tweaks panel (bottom-right of the live page) — lets you adjust colors, background, liquid glass in the browser without editing code. |

## No build step

Pure static HTML + React + Babel from CDN. To develop locally:

```bash
cd galton-demo
python -m http.server 8000
# Open http://localhost:8000
```

Any edit to the JSX files → hard-refresh the browser (Ctrl+Shift+R). Babel re-transpiles on reload.

## Mock data locations (in `app-v2.jsx`)

All mock data lives at the top of `app-v2.jsx`, lines 6–59:

### KPI tiles — `KPIS` (line 7)
Array of 8 tile objects. Each has:
```js
{
  label: 'Blended MER',       // header (uppercase, mono)
  value: '5.8x',               // hero number
  delta: '+0.4x vs prior',     // small text below hero
  trend: 'up',                 // 'up' or 'down' — controls arrow direction
  note: 'Revenue / Ad Spend',  // optional fine print
  active: true,                // highlights tile with chartreuse ring
  status: 'Healthy',           // optional status chip (LTV:CAC tile uses this)
}
```
Change the numbers, labels, or add a 9th tile — the grid auto-wraps.

### MER / CMER trend — `MER_SERIES` + `WEEKS` (lines 18–24)
Two line series over 12 weeks. Each series is `{ key, color, glow?, dashed?, values:[] }`. To change:
- Swap `values:[...]` for your data
- `glow: true` adds chartreuse halo (used on Blended MER)
- `dashed: true` makes the line dashed
- `color: 'var(--accent)'` uses the chartreuse accent; `'var(--ink)'` uses the ink color

### Revenue vs. Spend — `REV_SPEND` (line 25)
Same structure as `MER_SERIES`. Two lines: Revenue (glowing chartreuse) and Total Spend (dashed warm tan).

### New vs. Returning stacked bars — `STACKED` (line 31)
12 groups, each with `new_` and `ret` numeric values. Currently generated with a sin/cos pattern — replace with an explicit array if you want specific numbers.

### Insights — `INSIGHTS` (line 39)
Array of callout objects:
```js
{ tone: 'good', title: 'CMER improving.', body: '…' }
```
Tones: `good` (chartreuse), `warn` (muted), `info` (sage tint). Add/remove freely — the panel stacks them.

### Sidebar nav — `SIDEBAR` (line 45)
Two sections (GALTON + FINCH). Each item: `{ label, icon, active?, badge? }`. Available icons defined in `Icon` component (lines 62–83): `grid`, `channel`, `health`, `flask`, `link`, `home`, `megaphone`, `canvas`, `chart`, `calendar`, `caret`, `check`, `info`, `warn`, `sparkle`, `arrow_up`, `arrow_dn`.

## Chart tweaks (in `charts-v2.jsx`)

`LineChart` props:
- `width`, `height` — SVG viewBox dimensions
- `series` — array of `{ color, values, glow?, dashed? }`
- `xLabels` — array of strings for the x-axis (one per data point)
- `yTicks` — array of values to show grid lines + labels for. Numbers ≥1000 auto-format to `$Nk`.
- `showDots` — set to `false` to hide per-point circles

`StackedBars` props:
- `groups` — array of `{ key, values: { stackKey: number } }`
- `stackKeys` — array of `{ key, color }` defining the stack order (bottom first)
- Other props same as LineChart

## Styling

### Colors (edit in `index.html`, `:root` block)
All colors use OKLCH. Key tokens:
- `--bg-outer` / `--bg-field` — page background (overridable via Tweaks)
- `--surface` / `--surface-2` / `--surface-3` — glass panel backgrounds (light → dark)
- `--ink` / `--ink-2` / `--ink-soft` — text colors
- `--accent` / `--accent-ink` / `--accent-glow` — chartreuse accent
- `--line` / `--line-2` — dividers and borders

### Fonts
Loaded from Google Fonts in `index.html`:
- **Inter** — body/UI (default)
- **Instrument Serif** — italic subtitles (apply with `className="serif"`)
- **JetBrains Mono** — monospace labels (apply with `className="mono"`)

### Liquid glass effect
Defined in `index.html` under `.liquid-glass`. Activates via `:root[data-lg="on"]`. Exposes CSS vars `--lg-intensity`, `--lg-tint`, `--lg-blur`, `--lg-sheen`, `--lg-sheen-angle` — all controllable from the Tweaks panel.

## Tweaks panel defaults

Current defaults live in `app-v2.jsx` lines 389–404 inside the `EDITMODE-BEGIN`/`EDITMODE-END` block. To persist new tweaks you've dialed in via the panel:
1. Open the live page, play with the tweaks until you like it
2. In DevTools console, run `document.documentElement.style` to inspect current CSS vars
3. Update the EDITMODE block with the new values
4. Hard-refresh

## Workflow suggestions

- **Changing mock numbers for a specific client pitch:** edit `KPIS`, `MER_SERIES`, `REV_SPEND`, `STACKED`, `INSIGHTS` in `app-v2.jsx`. Commit + push, GitHub Pages auto-deploys in ~1 min.
- **Adding a new chart type:** add a new function in `charts-v2.jsx`, then register it on `window` at the bottom of the file (see existing pattern).
- **Adding a new panel:** copy an existing `function XPanel()` in `app-v2.jsx`, add it to the main grid in `App()`.
- **Changing layout:** the main grid is in `App()` at the bottom — currently three grid rows (8 KPIs / Trend+Insights / Revenue+NewReturning). Adjust `gridTemplateColumns` or `gap` there.

## Deploying updates

Any push to `main` → GitHub Pages rebuilds automatically. Check status:
```bash
gh api repos/jholguin7/galton-demo/pages --jq '.status'
```
Usually live within 1 minute of push.

## Branching

Same convention as the main Finch repo:
- `cuky/<description>` for Cuky's branches
- `tote/<description>` for Tote's branches
- PR into `main`, no CI required (it's a prototype — eyeball it in the browser)
