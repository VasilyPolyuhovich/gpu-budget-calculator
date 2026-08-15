# GPU Budget — Self-host open-weight LLM

Interactive budget for self-hosting open-weight LLMs (Qwen3.6-27B / Coder-Next / …)
on rented GPUs, with an honest comparison against paid APIs. Two pages, one shared
core. Bilingual (EN/UK), theme-aware, no framework/build. Updated **August 2026**.

**Live:** https://vasilypolyuhovich.github.io/gpu-budget-calculator/

## Two pages

- **`index.html` — Simple.** Cost-first, near-zero input: pick a workload preset
  and the number of seats → monthly team budget. An "Advanced" disclosure exposes
  GPU / rate / volume / hours. A "vs paid API" card shows, honestly, which is
  cheaper at the estimated token volume, the break-even point, and the advantages
  beyond price (full control, data stays with you, no external policy/rate limits).
- **`advanced.html` — Advanced.** Full control: every field, an editable GPU price
  list (add / reset / share via `?c=` link), the token-usage assumption knobs, plus
  the models table, vLLM setup and "from real deploys" reference.

## Shared core (`assets/`)

- `calc.js` — pure cost + API-comparison math (no DOM; unit-tested).
- `data.js` — default GPU + API price tables and the token assumption.
- `i18n.js` — uk/en dictionary + a DOM applier.
- `theme.css` — design tokens (light/dark) + components.

The shared files are classic scripts (work over `file://` and in Node), so the
math and dictionary are testable without a browser.

## Run locally

Uses relative `assets/*`, so serve it (don't just `open` the file):

```bash
python3 -m http.server 8000   # → http://localhost:8000
```

## Test

```bash
node --test                                      # calc / data / i18n unit tests
node test/validate-html.js index.html advanced.html   # i18n-key + element-id coverage
```

## Notes on the numbers

Only RunPod rates come from our own deploys. Entries marked `*` (Vast.ai) and all
API `$/Mtok` prices are from public listings, not verified by us. The token volume
in the API comparison is a transparent estimate (active-generation fraction ×
tok/s × input multiplier) — editable on the Advanced page. Verify live rates and
current AWQ quants before deploying.
