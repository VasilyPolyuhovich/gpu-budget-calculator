// assets/data.js — default GPU + API price tables and the token-usage assumption.
// All prices are ESTIMATES (Aug 2026), editable in the UI. Loadable in browser
// (window.Data) and node (require).
(function (root) {
  "use strict";
  const GPUS = [
    { label: "A100 80GB · RunPod Secure", rate: 1.39 },
    { label: "A100 80GB · RunPod SXM", rate: 1.59 },
    { label: "H100 80GB · RunPod Secure", rate: 2.89 },
    { label: "A100 80GB · Vast.ai *", rate: 0.67 }
  ];
  // kind: "same" = an open model via a provider's API (honest apples-to-apples);
  //       "frontier" = a stronger proprietary model (the savings ceiling).
  // pricePerMtok = blended ~80% input / 20% output (agentic coding is input-heavy),
  // from public listings Aug 2026 (DeepSeek-V4 $0.14/$0.28, GLM-5.2 $1.40/$4.40,
  // Kimi K2.6 $0.95/$4.00, Mistral Small 4 $0.15/$0.60; Qwen coding-model tier;
  // frontier Claude/GPT/Gemini ~$3-15). Estimates — verify before relying on them.
  const APIS = [
    { label: "Qwen API", pricePerMtok: 0.60, kind: "same" },
    { label: "DeepSeek", pricePerMtok: 0.17, kind: "same" },
    { label: "Mistral", pricePerMtok: 0.25, kind: "same" },
    { label: "Kimi / Moonshot", pricePerMtok: 1.55, kind: "same" },
    { label: "Z.ai / GLM", pricePerMtok: 2.00, kind: "same" },
    { label: "Claude / GPT / Gemini", pricePerMtok: 6.00, kind: "frontier" }
  ];
  // Transparent token-usage assumption (shown in the UI, editable in Advanced).
  const ASSUMPTION = { activeFraction: 0.2, tokPerSec: 93, inputMultiplier: 3 };
  const PRESETS = {
    light: { hoursDay: 2, daysMonth: 20 },
    medium: { hoursDay: 4, daysMonth: 22 },
    heavy: { hoursDay: 8, daysMonth: 22 }
  };
  const DEFAULT_VOLUME = 7;
  const api = { GPUS, APIS, ASSUMPTION, PRESETS, DEFAULT_VOLUME };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.Data = api;
})(typeof window !== "undefined" ? window : globalThis);
