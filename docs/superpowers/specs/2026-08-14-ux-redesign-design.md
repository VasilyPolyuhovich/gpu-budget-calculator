# GPU Budget Calculator — UX Redesign (two-page: Simple + Advanced)

Date: 2026-08-14
Status: Approved (brainstorm), pending implementation plan

## Problem

The current single page is operator-first: one dense screen with 6 sections and
a calculator that exposes presets + GPU buttons + a raw rate field + hours/days +
volume + seats + a price editor all at once. Controls overlap (a GPU button and
the rate field set the same value), and sections 04–06 (models / vLLM setup /
"from experience") are reference material meaningful mainly to the operator. A
newcomer (a colleague) can't get a quick answer without a walkthrough.

## Goal & audiences

- **Primary audience — a colleague:** answer "how much will this cost us per
  month?" in ~30 seconds, near-zero input.
- **Secondary audience — detail-lovers / the operator:** full control and the
  technical reference on a separate page.

## Architecture — two pages

- **`index.html` — Simple.** Cost-first hero. Preset + seats → cost. Everything
  fine-grained is behind an "Advanced" disclosure. Plus an honest "vs paid API"
  insight and a compact risk callout. Links to the Advanced page.
- **`advanced.html` — Advanced (= thorough configuration / reference).** All
  controls visible, price editor, side-by-side GPU comparison, full models table,
  vLLM setup, "from experience". This is essentially today's rich page,
  reorganized. Links back to Simple.

Shared across both: EN/UK toggle (existing i18n mechanism), per-seat + team
calculation, price data + `*` unverified footnote, theme-awareness (light/dark).

## Simple page (`index.html`)

### Layout (top → bottom)
1. **Header:** brand/eyebrow, right side `UK/EN` toggle + `Advanced →` link.
2. **H1 + lede:** "How much will it cost the team?" one-line explainer.
3. **Cost card:**
   - **Preset** segmented control: Light (2 h × 20) / Medium (4 h × 22, default) /
     Heavy (8 h × 22). Each shows its hours·days subtitle.
   - **Seats** stepper (− N +), default 1.
   - **Result:** big team total `$/mo`, gradient accent number; subline
     `$X / seat × N · base A100 Secure $1.39/hr + $7 volume`.
   - **`▸ Advanced` disclosure (inline):** GPU chips (A100 Secure $1.39 [default],
     A100 SXM $1.59, H100 Secure $2.89, Vast.ai * $0.67) + editable fields: rate,
     volume, hours/day, days/month. Selecting a GPU sets the rate; editing rate is
     still allowed (single source of truth = the rate field; chips are shortcuts).
4. **"vs paid API" insight card:**
   - API provider chips (selectable, editable $/Mtok): Qwen API (default),
     Z.ai/GLM, DeepSeek, Kimi/Moonshot, Mistral, and a Claude/GPT/Gemini
     "frontier" entry. Default = same open model's API (honest apples-to-apples).
   - Two tiles: **Self-host $/mo** vs **selected API $/mo** (team).
   - **Honest verdict** line: which is cheaper at the estimated volume, the
     **break-even** token volume (self-host fixed cost ÷ $/Mtok), and a note that
     vs frontier APIs it is near parity.
   - **Usage estimate** (transparent, editable in Advanced): tokens/mo derived
     from the preset via a stated assumption (active-generation fraction × tok/s,
     input multiplier). Shown as text so it never silently misleads.
   - **"Beyond price" panel** (the real differentiator, professional framing —
     no explicit "uncensored" wording on the public page): full root control /
     model + version pinning · data stays with you · no external policy or filter
     changes · no rate limits.
5. **Risk callout** (amber, compact): "Main risk — a forgotten pod. 24/7 ≈ ×8
   budget (~$1015/mo per card). Shut down after a session or auto-terminate."
6. **`▸ Details` disclosure:** short "what you pay for — models & prices"
   (a trimmed models blurb; full table lives on Advanced).
7. **Footer:** `*` Vast.ai + API prices are from public listings, not our
   deploys; token volume is an estimate; prices as of Aug 2026.

### Calculation model
- **Self-host (existing):** `perSeat = hoursMonth × rate + volume`;
  `team = perSeat × seats`; `hoursMonth = hoursDay × daysMonth`.
- **API comparison (new):**
  - `tokensPerSeat = hoursMonth × activeFraction × tokPerSec × 3600 × (1 + inputMultiplier)`
    with defaults `activeFraction = 0.20`, `tokPerSec = 93`, `inputMultiplier = 3`
    (≈ 60 Mtok/mo for 3 seats at Medium). All three are editable in Advanced and
    shown in the usage line.
  - `tokensTeam = tokensPerSeat × seats`; `apiCostTeam = tokensTeam(in Mtok) × pricePerMtok`.
  - `breakEvenMtok = teamSelfHostCost ÷ pricePerMtok` (below this, API is cheaper).
  - Verdict compares `team` vs `apiCostTeam` and states the delta + break-even.
- All provider prices and the token assumption are **estimates**, labeled; to be
  web-verified (Aug 2026) at implementation time.

### States & behavior
- Preset click sets hours/day + days/month (and highlights the segment).
- Editing an Advanced field de-highlights the preset (custom mode), as today.
- GPU chip sets the rate; the rate field remains editable.
- Everything recomputes live. Numbers are locale-neutral.
- Persist: prices/config in `localStorage` (**bump key to invalidate stale v2**);
  language in its own key; share-link `?c=` continues to encode config only.

## Advanced page (`advanced.html`)
Reorganized current rich page: full-control calculator (all fields + seats),
price editor (add/remove/reset/share GPUs), side-by-side GPU comparison table,
full models table (with SWE-bench), vLLM setup rows, "from experience" rows,
and the full API-comparison controls (all token-model knobs exposed). `← Simple`
link. Reuses the shared i18n dictionary and theme.

## Non-goals (YAGNI)
- No charts/animation library — CSS-only visuals (segmented control, stacked bar,
  tiles) are enough.
- No backend, no live price fetching in-page — prices are baked, editable.
- No "uncensored" marketing on the public page (kept professional; the explicit
  framing, if wanted, belongs in the private `-lab` edition).
- No third tier — exactly two pages.

## Open items to resolve at build time
- Verify current API $/Mtok for each provider (Qwen, Z.ai/GLM, DeepSeek, Kimi,
  Mistral, Claude/GPT/Gemini) via web search; label all as estimates.
- Confirm the token-assumption defaults read sensibly once wired to live numbers.

## Validation
- i18n: every `data-i18n*` key present in both `uk` and `en`; sets identical.
- `node --check` on the inline script; all referenced element IDs exist.
- Manual scenarios: seats 1 vs 5; each preset; GPU switch; API switch (same-model
  vs frontier) shows a sane verdict + break-even; EN/UK swap covers all new copy;
  light/dark both legible; mobile width (no horizontal scroll on body).
