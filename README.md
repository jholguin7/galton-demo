# Galton Dashboard — Interactive Prototype

> **This repo is frozen.** Active development moved to the private monorepo `jholguin7/finch-app` (Galton is now its analytics module). This snapshot remains as a public showcase.

Static mockup of the Galton analytics dashboard (by Finch).

**Live demo:** https://jholguin7.github.io/galton-demo/

## What it is

A prototype interface for Galton — a daily business health check dashboard that unifies marketing attribution, customer health, and incrementality signals across Shopify, Meta, Google Ads, TikTok, and GA4.

Features shown:
- Blended MER, CMER, Contribution Margin, AOV, LTV:CAC KPIs
- MER & CMER trend over 12 weeks
- Galton Insights (auto-generated callouts)
- Revenue vs. Spend
- New vs. Returning Revenue split

## Running locally

It's pure static HTML with React + Babel loaded from CDN — no build step.

```bash
# Any static server will work:
python -m http.server 8000
# Then open http://localhost:8000
```

## Design system

Sage-glass + chartreuse accent, Instrument Serif italic subtitles, Inter body, JetBrains Mono labels. Liquid glass effect adapted from [Petr Knoll's technique](https://codepen.io/Petr-Knoll/pen/QwWLZdx).

Use the Tweaks panel (bottom-right) to adjust colors, background, and glass effect in real time.
