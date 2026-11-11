# Consult Timeline (concept mock-up)

A single-page mock-up of a modular inpatient timeline for consultants: core sections on one
time axis, shareable templates, specialty tabs (liver injury, infectious diseases), and a
data-scope panel. **Every value is synthetic. Nothing here comes from a real chart.**

## Layout

| Path | What it is |
|---|---|
| `src/head.html` | Page markup and all CSS |
| `src/data.js` | The synthetic admission: labs, vitals, meds, cultures, prior records |
| `src/app.js` | Rendering and interaction |
| `build.sh` | Concatenates the three into `dist/index.html` |
| `netlify.toml` | Netlify build settings (`bash build.sh`, publish `dist/`) |

## Build and preview

```bash
bash build.sh
open dist/index.html
```

No dependencies and no bundler. The output is one self-contained HTML file.

## Deploy

Netlify builds on every push to `main` using `netlify.toml`.

## Reference checks

- LiverTox likelihood categories were checked against the NIH LiverTox chapters (Nov 2026).
- MELD 3.0 formula and bounds were checked against a published calculator.
- Susceptibility MICs and breakpoint calls are illustrative and were not checked against CLSI tables.
