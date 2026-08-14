# GPU Budget Calculator — UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the calculator into a cost-first **Simple** page (`index.html`) for a colleague and a full-control **Advanced** page (`advanced.html`) for detail-lovers, add an honest "vs paid API" comparison with break-even, sharing one theme + i18n + calc module.

**Architecture:** Extract shared logic into classic (non-module, `file://`-friendly) scripts — `assets/calc.js` (pure math, node-testable), `assets/i18n.js` (dictionary + DOM applier), `assets/theme.css` (design tokens + components). Each page holds only its markup + a thin wiring script. Pure math is TDD'd with `node:test`; pages are validated with key-parity + `node --check` + manual scenarios.

**Tech Stack:** Vanilla HTML/CSS/JS (no framework, no build). `node --test` for unit tests. GitHub Pages (`gh-pages`).

**Design source of truth:**
- Spec: `docs/superpowers/specs/2026-08-14-ux-redesign-design.md`
- Approved visual mockup (exact styling to port): `docs/superpowers/specs/2026-08-14-ux-redesign-mockup-simple.html`

---

## File Structure

- Create `assets/calc.js` — pure functions: `hoursMonth`, `selfHostPerSeat`, `selfHostTeam`, `tokensPerSeat`, `apiCostTeam`, `breakEvenMtok`. No DOM. Exports for node + attaches `window.Calc`.
- Create `assets/i18n.js` — `I18N = {uk,en}` (all keys for both pages) + `applyI18n(root, lang)` (sets textContent/innerHTML/aria + `<html lang>` + title/meta). Attaches to `window`; exports `I18N` for tests.
- Create `assets/theme.css` — design tokens (light/dark) + components (`.seg`, `.stepper`, `.card`, `.chip`, `.disc`, `.vs`, `.cmp`, `.risk`, tables, etc.), ported from the approved mockup.
- Create `assets/data.js` — `GPUS` (label, rate) and `APIS` (label, pricePerMtok, kind) default arrays + token-assumption defaults. Attaches `window.Data`; exports for tests. Prices labelled estimates.
- Rewrite `index.html` — Simple page markup + inline wiring script.
- Create `advanced.html` — Advanced page markup + inline wiring script.
- Create `test/calc.test.js` — `node:test` unit tests for `calc.js`.
- Create `test/i18n.test.js` — key-parity test for `i18n.js`.
- Create `test/validate-html.js` — asserts every `data-i18n*` key in a page exists in `I18N`, and every JS-referenced `id` exists in the page.
- Update `README.md` — two-page structure, `node --test`, `python -m http.server` note (modules not used, but tests need node).

Branch: `redesign/ux-two-page` (already created; spec + mockup already committed there).

---

## Task 1: Pure calc module (TDD)

**Files:**
- Create: `assets/calc.js`
- Test: `test/calc.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// test/calc.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const C = require("../assets/calc.js");

test("hoursMonth = hoursDay * daysMonth", () => {
  assert.equal(C.hoursMonth(4, 22), 88);
});

test("selfHostPerSeat = hoursMonth*rate + volume", () => {
  assert.equal(C.selfHostPerSeat({ hoursDay: 4, daysMonth: 22, rate: 1.39, volume: 7 }), 88 * 1.39 + 7);
});

test("selfHostTeam multiplies by seats", () => {
  const per = C.selfHostPerSeat({ hoursDay: 4, daysMonth: 22, rate: 1.39, volume: 7 });
  assert.equal(C.selfHostTeam({ hoursDay: 4, daysMonth: 22, rate: 1.39, volume: 7, seats: 3 }), per * 3);
});

test("tokensPerSeat uses the stated assumption (Mtok)", () => {
  // 88h * 0.20 active * 93 tok/s * 3600 * (1+3 input) ≈ 235.7 Mtok? verify formula
  const mtok = C.tokensPerSeatMtok({ hoursDay: 4, daysMonth: 22, activeFraction: 0.2, tokPerSec: 93, inputMultiplier: 3 });
  assert.ok(Math.abs(mtok - (88 * 0.2 * 93 * 3600 * 4) / 1e6) < 1e-6);
});

test("apiCostTeam = tokensTeam(Mtok) * pricePerMtok", () => {
  assert.equal(C.apiCostTeam({ tokensPerSeatMtok: 20, seats: 3, pricePerMtok: 0.5 }), 20 * 3 * 0.5);
});

test("breakEvenMtok = teamSelfHostCost / pricePerMtok", () => {
  assert.equal(C.breakEvenMtok({ teamSelfHostCost: 387, pricePerMtok: 0.5 }), 774);
});

test("breakEvenMtok returns Infinity for zero price", () => {
  assert.equal(C.breakEvenMtok({ teamSelfHostCost: 387, pricePerMtok: 0 }), Infinity);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/calc.test.js`
Expected: FAIL — `Cannot find module '../assets/calc.js'`.

- [ ] **Step 3: Implement `assets/calc.js`**

```js
// assets/calc.js — pure, no DOM. Loadable in browser (window.Calc) and node (require).
(function (root) {
  "use strict";
  function hoursMonth(hoursDay, daysMonth) {
    return (Number(hoursDay) || 0) * (Number(daysMonth) || 0);
  }
  function selfHostPerSeat({ hoursDay, daysMonth, rate, volume }) {
    return hoursMonth(hoursDay, daysMonth) * (Number(rate) || 0) + (Number(volume) || 0);
  }
  function selfHostTeam(p) {
    return selfHostPerSeat(p) * Math.max(1, Math.floor(Number(p.seats) || 1));
  }
  // Transparent estimate: active generation fraction of session time, at tokPerSec,
  // scaled by (1 + inputMultiplier) to account for input tokens. Returned in Mtok.
  function tokensPerSeatMtok({ hoursDay, daysMonth, activeFraction, tokPerSec, inputMultiplier }) {
    const secs = hoursMonth(hoursDay, daysMonth) * 3600;
    const outTok = secs * (Number(activeFraction) || 0) * (Number(tokPerSec) || 0);
    return (outTok * (1 + (Number(inputMultiplier) || 0))) / 1e6;
  }
  function apiCostTeam({ tokensPerSeatMtok, seats, pricePerMtok }) {
    return (Number(tokensPerSeatMtok) || 0) * Math.max(1, Math.floor(Number(seats) || 1)) * (Number(pricePerMtok) || 0);
  }
  function breakEvenMtok({ teamSelfHostCost, pricePerMtok }) {
    const p = Number(pricePerMtok) || 0;
    return p > 0 ? (Number(teamSelfHostCost) || 0) / p : Infinity;
  }
  const api = { hoursMonth, selfHostPerSeat, selfHostTeam, tokensPerSeatMtok, apiCostTeam, breakEvenMtok };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.Calc = api;
})(typeof window !== "undefined" ? window : globalThis);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/calc.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add assets/calc.js test/calc.test.js
git commit -m "feat(calc): pure cost + API-comparison math with node tests"
```

---

## Task 2: Shared theme CSS

**Files:**
- Create: `assets/theme.css`
- Reference: `docs/superpowers/specs/2026-08-14-ux-redesign-mockup-simple.html` (the `<style>` block is the source)

- [ ] **Step 1: Port the mockup CSS into `assets/theme.css`**

Copy the entire contents of the `<style>…</style>` block from the mockup file into `assets/theme.css` verbatim, then add the light/dark token block already present in the current `index.html` (the `:root[data-theme="light"|"dark"]` overrides) so the existing EN/UK + theme toggle keeps working. Keep all component classes: `.seg`, `.stepper`, `.card`, `.result`, `.big`, `.disc`, `.vs`, `.apis/.api`, `.cmp`, `.verdict`, `.beyond`, `.risk`, `.foot`, `.pill`, plus the table/`.scroll`/`.tag`/`.warn`/`.setup` classes from the current page (needed by Advanced).

- [ ] **Step 2: Verify it parses (no syntax errors)**

Run: `node -e "const c=require('fs').readFileSync('assets/theme.css','utf8'); const o=(c.match(/{/g)||[]).length, cl=(c.match(/}/g)||[]).length; if(o!==cl) throw new Error('brace mismatch '+o+'/'+cl); console.log('braces ok',o)"`
Expected: `braces ok <n>`.

- [ ] **Step 3: Commit**

```bash
git add assets/theme.css
git commit -m "feat(theme): shared design tokens + components (ported from approved mockup)"
```

---

## Task 3: i18n dictionary + applier (TDD parity)

**Files:**
- Create: `assets/i18n.js`
- Test: `test/i18n.test.js`

- [ ] **Step 1: Write the failing parity test**

```js
// test/i18n.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { I18N } = require("../assets/i18n.js");

test("uk and en have identical key sets", () => {
  const uk = Object.keys(I18N.uk).sort();
  const en = Object.keys(I18N.en).sort();
  assert.deepEqual(uk, en, "uk/en key sets differ");
});

test("no empty strings", () => {
  for (const lang of ["uk", "en"]) {
    for (const [k, v] of Object.entries(I18N[lang])) {
      assert.ok(typeof v === "string" && v.length > 0, `${lang}.${k} empty`);
    }
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test test/i18n.test.js`
Expected: FAIL — cannot find `../assets/i18n.js`.

- [ ] **Step 3: Implement `assets/i18n.js`**

Structure (fill every key used by both pages — port existing keys from current `index.html` `T` object, then ADD the new Simple-page keys below and the Advanced-only keys):

```js
// assets/i18n.js
(function (root) {
  "use strict";
  const I18N = {
    uk: {
      /* ...all existing keys from current index.html T.uk... */
      /* NEW simple-page keys: */
      simple_h1: "Скільки коштуватиме команді?",
      simple_lede: "Навантаження + люди → бюджет. І чесне порівняння з платними API.",
      load_label: "Навантаження на людину",
      seats_label: "Робочих місць",
      adv_toggle: "Розширено — GPU · ставка · volume · години/дні",
      link_advanced: "Розширений →",
      link_simple: "← Простий",
      vs_title: "А якби платити за API?",
      vs_hint: "Обери провайдера. Обсяг оцінено з пресета (можна змінити в Розширено).",
      vs_self: "Self-host",
      vs_verdict_api_cheaper: "При цьому обсязі API дешевший на ~{delta}/міс. Self-host на грошах виграє від ~{be} Mtok/міс — або одразу, якщо рахувати контроль.",
      vs_verdict_self_cheaper: "При цьому обсязі self-host дешевший на ~{delta}/міс.",
      vs_usage: "Оцінка обсягу: ~{mtok} Mtok/міс на команду (активна генерація {af}% × {tps} tok/s, вхід ×{im}). Змінюється в Розширено.",
      beyond_control: "Повний контроль (root). Свій стек, свої версії, пін моделі",
      beyond_data: "Дані лишаються у тебе. Нічого не йде до провайдера",
      beyond_policy: "Без зовнішніх змін політик/фільтрів. Поведінка стабільна",
      beyond_rate: "Без rate-limit. Пропускна здатність — твоя",
      details_toggle: "Деталі: за що платиш — моделі та ціни",
      foot_star_full: "* Vast.ai та ціни API ми не перевіряли на практиці — з публічних лістингів. Обсяг у токенах — оцінка. Серпень 2026."
    },
    en: {
      /* ...all existing keys from current index.html T.en... */
      simple_h1: "What will it cost the team?",
      simple_lede: "Workload + people → budget. Plus an honest comparison with paid APIs.",
      load_label: "Workload per person",
      seats_label: "Seats",
      adv_toggle: "Advanced — GPU · rate · volume · hours/days",
      link_advanced: "Advanced →",
      link_simple: "← Simple",
      vs_title: "What if you paid for an API?",
      vs_hint: "Pick a provider. Volume is estimated from the preset (editable in Advanced).",
      vs_self: "Self-host",
      vs_verdict_api_cheaper: "At this volume the API is ~{delta}/mo cheaper. Self-host wins on price above ~{be} Mtok/mo — or right away if you count control.",
      vs_verdict_self_cheaper: "At this volume self-host is ~{delta}/mo cheaper.",
      vs_usage: "Volume estimate: ~{mtok} Mtok/mo for the team (active generation {af}% × {tps} tok/s, input ×{im}). Editable in Advanced.",
      beyond_control: "Full control (root). Your stack, your versions, pin the model",
      beyond_data: "Data stays with you. Nothing goes to a provider",
      beyond_policy: "No external policy/filter changes. Behavior is stable",
      beyond_rate: "No rate limits. The throughput is yours",
      details_toggle: "Details: what you pay for — models & prices",
      foot_star_full: "* Vast.ai and API prices are unverified by us — from public listings. Token volume is an estimate. August 2026."
    }
  };
  function applyI18n(rootEl, lang) {
    const d = I18N[lang] || I18N.uk;
    (rootEl || document).querySelectorAll("[data-i18n]").forEach((el) => {
      const k = el.getAttribute("data-i18n"); if (d[k] != null) el.textContent = d[k];
    });
    (rootEl || document).querySelectorAll("[data-i18n-html]").forEach((el) => {
      const k = el.getAttribute("data-i18n-html"); if (d[k] != null) el.innerHTML = d[k];
    });
    (rootEl || document).querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const k = el.getAttribute("data-i18n-aria"); if (d[k] != null) el.setAttribute("aria-label", d[k]);
    });
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }
  const api = { I18N, applyI18n };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.I18N = I18N; root.applyI18n = applyI18n;
})(typeof window !== "undefined" ? window : globalThis);
```

> When porting existing keys, copy them verbatim from the current `index.html` `T` object so no Advanced-page copy is lost.

- [ ] **Step 4: Run to verify it passes**

Run: `node --test test/i18n.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add assets/i18n.js test/i18n.test.js
git commit -m "feat(i18n): shared uk/en dictionary + DOM applier, parity-tested"
```

---

## Task 4: Default data (GPUs + APIs)

**Files:**
- Create: `assets/data.js`
- Test: `test/data.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/data.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const D = require("../assets/data.js");

test("GPUS has the measured A100 Secure default first", () => {
  assert.equal(D.GPUS[0].rate, 1.39);
  assert.match(D.GPUS[0].label, /A100 Secure/);
});
test("APIS default (index 0) is the same open model, cheap tier", () => {
  assert.ok(D.APIS[0].pricePerMtok <= 1.0);
});
test("APIS includes a frontier tier and Z.ai", () => {
  assert.ok(D.APIS.some((a) => a.kind === "frontier"));
  assert.ok(D.APIS.some((a) => /Z\.ai|GLM/.test(a.label)));
});
test("token assumption defaults are present", () => {
  assert.equal(D.ASSUMPTION.activeFraction, 0.2);
  assert.equal(D.ASSUMPTION.tokPerSec, 93);
  assert.equal(D.ASSUMPTION.inputMultiplier, 3);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test test/data.test.js`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `assets/data.js`** (prices are estimates; Task 8 re-verifies)

```js
// assets/data.js
(function (root) {
  "use strict";
  const GPUS = [
    { label: "A100 80GB · RunPod Secure", rate: 1.39 },
    { label: "A100 80GB · RunPod SXM", rate: 1.59 },
    { label: "H100 80GB · RunPod Secure", rate: 2.89 },
    { label: "A100 80GB · Vast.ai *", rate: 0.67 }
  ];
  const APIS = [
    { label: "Qwen API", pricePerMtok: 0.50, kind: "same" },
    { label: "Z.ai / GLM", pricePerMtok: 0.60, kind: "same" },
    { label: "DeepSeek", pricePerMtok: 0.45, kind: "same" },
    { label: "Kimi / Moonshot", pricePerMtok: 1.00, kind: "same" },
    { label: "Mistral", pricePerMtok: 0.90, kind: "same" },
    { label: "Claude / GPT / Gemini", pricePerMtok: 6.00, kind: "frontier" }
  ];
  const ASSUMPTION = { activeFraction: 0.2, tokPerSec: 93, inputMultiplier: 3 };
  const PRESETS = { light: { hoursDay: 2, daysMonth: 20 }, medium: { hoursDay: 4, daysMonth: 22 }, heavy: { hoursDay: 8, daysMonth: 22 } };
  const DEFAULT_VOLUME = 7;
  const api = { GPUS, APIS, ASSUMPTION, PRESETS, DEFAULT_VOLUME };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.Data = api;
})(typeof window !== "undefined" ? window : globalThis);
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test test/data.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add assets/data.js test/data.test.js
git commit -m "feat(data): default GPU + API price tables and token assumption"
```

---

## Task 5: Simple page (`index.html`)

**Files:**
- Modify (rewrite): `index.html`
- Reference markup/styling: `docs/superpowers/specs/2026-08-14-ux-redesign-mockup-simple.html`

- [ ] **Step 1: Write the page markup**

Replace `index.html` `<body>` with the structure from the approved mockup, but:
- `<head>`: `<link rel="stylesheet" href="assets/theme.css">`; `<title data-i18n>` set by i18n; keep `<meta name=description>`.
- Before `</body>`: `<script src="assets/calc.js"></script><script src="assets/data.js"></script><script src="assets/i18n.js"></script>` then the inline wiring `<script>` (Step 3).
- Tag every visible string with `data-i18n` / `data-i18n-html` using the keys from Task 3.
- IDs the wiring needs: `#seg` (preset group with 3 `button[data-preset]`), `#seats` `#seatsVal` `#seatsDec` `#seatsInc`, `#total` `#perseat` `#basisLine`, `#advToggle` `#advBody`, `#gpuChips`, `#rate` `#vol` `#hpd` `#dpm`, `#apiChips`, `#selfTile` `#apiTile` `#apiName` `#verdict` `#usageLine`, `#langToggle`, `#detailsToggle`.

- [ ] **Step 2: Write the wiring script (inline in index.html)**

```js
"use strict";
const $ = (id) => document.getElementById(id);
const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
const LS = "gpuBudget.v3", LANG_KEY = "gpuBudgetLang.v1";
const state = {
  preset: "medium", seats: 1, gpuIdx: 0, apiIdx: 0,
  rate: Data.GPUS[0].rate, volume: Data.DEFAULT_VOLUME,
  hoursDay: Data.PRESETS.medium.hoursDay, daysMonth: Data.PRESETS.medium.daysMonth,
  assumption: Object.assign({}, Data.ASSUMPTION),
  lang: (localStorage.getItem(LANG_KEY) || (navigator.language||"").slice(0,2)) === "en" ? "en" : "uk"
};
try { Object.assign(state, JSON.parse(localStorage.getItem(LS) || "{}")); } catch (e) {}

function fmtVerdict() {
  const per = Calc.selfHostPerSeat(state);
  const team = Calc.selfHostTeam(state);
  const mtokPer = Calc.tokensPerSeatMtok(Object.assign({ hoursDay: state.hoursDay, daysMonth: state.daysMonth }, state.assumption));
  const price = Data.APIS[state.apiIdx].pricePerMtok;
  const apiTeam = Calc.apiCostTeam({ tokensPerSeatMtok: mtokPer, seats: state.seats, pricePerMtok: price });
  const be = Calc.breakEvenMtok({ teamSelfHostCost: team, pricePerMtok: price });
  const d = I18N[state.lang];
  const t = (k, m) => Object.entries(m).reduce((s, [kk, vv]) => s.replaceAll("{" + kk + "}", vv), d[k]);
  return { per, team, apiTeam,
    verdict: apiTeam < team
      ? t("vs_verdict_api_cheaper", { delta: money(team - apiTeam), be: (Math.round(be)).toLocaleString("en-US") })
      : t("vs_verdict_self_cheaper", { delta: money(apiTeam - team) }),
    usage: t("vs_usage", { mtok: (mtokPer * state.seats).toFixed(1), af: state.assumption.activeFraction * 100, tps: state.assumption.tokPerSec, im: state.assumption.inputMultiplier }),
    mtokPer };
}

function render() {
  const r = fmtVerdict();
  $("total").textContent = money(r.team);
  $("perseat").textContent = money(r.per);
  $("seatsVal").textContent = state.seats;
  $("selfTile").textContent = money(r.team);
  $("apiTile").textContent = money(r.apiTeam);
  $("apiName").textContent = Data.APIS[state.apiIdx].label;
  $("verdict").textContent = r.verdict;
  $("usageLine").textContent = r.usage;
  document.querySelectorAll("#seg [data-preset]").forEach((b) => b.classList.toggle("on", b.dataset.preset === state.preset));
  document.querySelectorAll("#gpuChips .chip").forEach((c, i) => c.classList.toggle("on", i === state.gpuIdx));
  document.querySelectorAll("#apiChips .api").forEach((c, i) => c.classList.toggle("on", i === state.apiIdx));
  if ($("rate")) $("rate").value = state.rate;
  if ($("vol")) $("vol").value = state.volume;
  save();
}
function save() { try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) {} }

function buildChips() {
  $("gpuChips").innerHTML = Data.GPUS.map((g, i) =>
    `<span class="chip" data-i="${i}">${g.label.replace(/·.*/, "").trim()} <span class="p">$${g.rate.toFixed(2)}</span></span>`).join("");
  $("gpuChips").querySelectorAll(".chip").forEach((c) => c.onclick = () => { state.gpuIdx = +c.dataset.i; state.rate = Data.GPUS[state.gpuIdx].rate; render(); });
  $("apiChips").innerHTML = Data.APIS.map((a, i) =>
    `<span class="api" data-i="${i}">${a.label} <span class="p">$${a.pricePerMtok.toFixed(2)}</span></span>`).join("");
  $("apiChips").querySelectorAll(".api").forEach((c) => c.onclick = () => { state.apiIdx = +c.dataset.i; render(); });
}

document.querySelectorAll("#seg [data-preset]").forEach((b) => b.onclick = () => {
  state.preset = b.dataset.preset;
  const p = Data.PRESETS[state.preset]; state.hoursDay = p.hoursDay; state.daysMonth = p.daysMonth; render();
});
$("seatsInc").onclick = () => { state.seats++; render(); };
$("seatsDec").onclick = () => { state.seats = Math.max(1, state.seats - 1); render(); };
$("advToggle").onclick = () => $("advBody").classList.toggle("open");
if ($("rate")) $("rate").oninput = () => { state.rate = parseFloat($("rate").value) || 0; render(); };
if ($("vol")) $("vol").oninput = () => { state.volume = parseFloat($("vol").value) || 0; render(); };
$("langToggle").onclick = () => { state.lang = state.lang === "uk" ? "en" : "uk"; localStorage.setItem(LANG_KEY, state.lang); applyI18n(document, state.lang); $("langToggle").textContent = state.lang === "uk" ? "EN" : "UK"; render(); };

buildChips();
applyI18n(document, state.lang);
$("langToggle").textContent = state.lang === "uk" ? "EN" : "UK";
render();
```

- [ ] **Step 3: Validate the page script parses**

Run: `node -e "const h=require('fs').readFileSync('index.html','utf8'); const m=h.match(/<script>([\s\S]*?)<\/script>/g).map(s=>s.replace(/<\/?script>/g,'')).join('\n'); require('fs').writeFileSync('/tmp/idx.js', 'const Data={GPUS:[{label:\"a\",rate:1}],APIS:[{label:\"x\",pricePerMtok:1}],PRESETS:{medium:{hoursDay:4,daysMonth:22}},ASSUMPTION:{activeFraction:.2,tokPerSec:93,inputMultiplier:3},DEFAULT_VOLUME:7};'+m); " 2>&1; node --check /tmp/idx.js && echo "index script OK"`
Expected: `index script OK`.

- [ ] **Step 4: Validate i18n key coverage + IDs**

Run: `node test/validate-html.js index.html` (created in Task 7)
Expected: `index.html OK`. (Run this step after Task 7; if running Task 5 first, defer to Task 7's validation.)

- [ ] **Step 5: Manual scenario check**

Run: `python3 -m http.server 8000` then open `http://localhost:8000`. Verify: Medium+1 seat → `$129`; seats 3 → `$387`; switch GPU chip to H100 → number jumps; switch API to Qwen ($0.50) → API tile `$30`, verdict says API cheaper + break-even; switch API to frontier ($6) → API tile ≈ `$360`, verdict near parity; EN/UK swaps every string; dark/light both legible; no horizontal body scroll at 375px.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(simple): cost-first index.html (preset+seats, vs-API insight, shared assets)"
```

---

## Task 6: Advanced page (`advanced.html`)

**Files:**
- Create: `advanced.html`
- Reference: current `index.html` history (`git show gh-pages:index.html`) for the full controls/tables

- [ ] **Step 1: Assemble the markup**

Build `advanced.html` from the pre-redesign `index.html` body (calculator with ALL fields visible + price editor with add/reset/share, scenarios table, always-on warn, full models table, setup rows, from-experience rows), plus a `← Simple` link (`data-i18n="link_simple"`) and an expanded "vs API" section exposing the token-assumption knobs (`activeFraction`, `tokPerSec`, `inputMultiplier`) as fields. Use `assets/theme.css`, `assets/calc.js`, `assets/data.js`, `assets/i18n.js` (same includes as index). Every string uses a `data-i18n*` key already present in `assets/i18n.js` (they were ported in Task 3).

- [ ] **Step 2: Write the wiring script**

Reuse the same patterns as Task 5 plus the price-editor from the pre-redesign page (`git show gh-pages:index.html` — the `renderCfgList`, `addGpu`, `resetCfg`, `shareCfg`, `?c=` logic). Bind the assumption fields to `state.assumption` and re-render. Full-control fields (`hpd/dpm/rate/vol/seats`) all visible and editable.

- [ ] **Step 3: Validate the page script parses**

Run: same extraction pattern as Task 5 Step 3 against `advanced.html`.
Expected: `advanced script OK`.

- [ ] **Step 4: Manual check**

Serve and open `http://localhost:8000/advanced.html`: all fields editable, price editor add/remove/reset/share works, `?c=` link round-trips, models/setup/experience render, `← Simple` link navigates, EN/UK covers all strings.

- [ ] **Step 5: Commit**

```bash
git add advanced.html
git commit -m "feat(advanced): full-control config + reference page on shared assets"
```

---

## Task 7: HTML validator + cross-links + README

**Files:**
- Create: `test/validate-html.js`
- Modify: `index.html`, `advanced.html` (ensure cross-links present), `README.md`

- [ ] **Step 1: Write `test/validate-html.js`**

```js
// Usage: node test/validate-html.js <file.html> [...]
const fs = require("fs");
const { I18N } = require("../assets/i18n.js");
let bad = 0;
for (const file of process.argv.slice(2)) {
  const html = fs.readFileSync(file, "utf8");
  const script = (html.match(/<script>([\s\S]*?)<\/script>/g) || []).join("\n");
  const markup = html.replace(/<script>[\s\S]*?<\/script>/g, "");
  const keys = new Set([...markup.matchAll(/data-i18n(?:-html|-aria)?="([^"]+)"/g)].map((m) => m[1]));
  const missing = [...keys].filter((k) => I18N.uk[k] == null || I18N.en[k] == null);
  const ids = new Set([...markup.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  const refIds = new Set([...script.matchAll(/\$\("([^"]+)"\)/g)].map((m) => m[1]));
  const missingIds = [...refIds].filter((i) => !ids.has(i));
  if (missing.length || missingIds.length) {
    bad++;
    console.error(`${file}: missing i18n keys=${JSON.stringify(missing)} missing ids=${JSON.stringify(missingIds)}`);
  } else console.log(`${file} OK`);
}
process.exit(bad ? 1 : 0);
```

- [ ] **Step 2: Run the validator on both pages**

Run: `node test/validate-html.js index.html advanced.html`
Expected: `index.html OK` and `advanced.html OK`.

- [ ] **Step 3: Ensure cross-links + run full test suite**

Confirm `index.html` has `Advanced →` (`data-i18n="link_advanced"`, href `advanced.html`) and `advanced.html` has `← Simple` (`data-i18n="link_simple"`, href `index.html`).
Run: `node --test` (all tests) and `node test/validate-html.js index.html advanced.html`.
Expected: all PASS + both OK.

- [ ] **Step 4: Update README**

Rewrite `README.md` to describe the two pages (Simple = quick cost for anyone; Advanced = full config + reference), how to run (`python3 -m http.server`), and how to test (`node --test`, `node test/validate-html.js index.html advanced.html`).

- [ ] **Step 5: Commit**

```bash
git add test/validate-html.js index.html advanced.html README.md
git commit -m "test: html key/id validator; add cross-links; update README"
```

---

## Task 8: Verify live prices (web) and finalize data

**Files:**
- Modify: `assets/data.js`

- [ ] **Step 1: Web-search current (Aug 2026) prices**

Look up current $/Mtok (blended input+output) for: Qwen API, Z.ai/GLM, DeepSeek, Kimi/Moonshot, Mistral, and a Claude/GPT/Gemini frontier figure; and re-confirm RunPod A100 Secure/SXM, H100 Secure, Vast.ai A100. Record sources in the commit message.

- [ ] **Step 2: Update `assets/data.js`**

Set the verified numbers in `GPUS`/`APIS`. Keep the `*` on Vast and the "estimate" framing (footnote already says unverified). If a same-model API is cheaper than the current default, keep index 0 = the cheapest honest same-model option.

- [ ] **Step 3: Re-run tests + validator**

Run: `node --test && node test/validate-html.js index.html advanced.html`
Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add assets/data.js
git commit -m "data: verify Aug-2026 API + GPU prices from public listings (sources in body)"
```

---

## Task 9: Final review, preview, PR

- [ ] **Step 1: Full validation**

Run: `node --test && node test/validate-html.js index.html advanced.html`
Expected: all green.

- [ ] **Step 2: Manual preview both pages** (serve on :8000) across EN/UK + light/dark + 375px width. Confirm all Task 5/6 manual checks.

- [ ] **Step 3: Push branch and open PR to `gh-pages`**

```bash
git push -u origin redesign/ux-two-page
gh pr create --base gh-pages --title "UX redesign: Simple + Advanced pages, vs-API insight" --body "See docs/superpowers/specs/2026-08-14-ux-redesign-design.md"
```

- [ ] **Step 4:** Do NOT merge automatically — the user reviews the PR and the live preview, then merges (publishes to GitHub Pages).

---

## Self-review notes (author)

- **Spec coverage:** two pages (Tasks 5,6) · near-zero Simple input (Task 5) · vs-API + break-even + honest verdict (Tasks 1,5) · beyond-price panel (Task 3 keys + Task 5 markup) · risk callout (Task 5 markup) · Advanced full control + editor + models/setup/experience (Task 6) · shared i18n/theme/calc (Tasks 1–3) · localStorage bump v3 (Task 5, `LS="gpuBudget.v3"`) · Vast `*` + estimates (Tasks 4,7,8). All covered.
- **Placeholder scan:** the only intentionally-deferred content is the price *values* in `data.js`, finalized in Task 8 with web sources; the code paths are complete before then.
- **Type/name consistency:** `Calc.*`, `Data.{GPUS,APIS,ASSUMPTION,PRESETS,DEFAULT_VOLUME}`, `applyI18n`, `state.*` names match across tasks; `tokensPerSeatMtok` used consistently in calc + wiring.
