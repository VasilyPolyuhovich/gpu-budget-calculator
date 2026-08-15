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
  // kind: "same" = the same open model via a provider's API (honest apples-to-apples);
  //       "frontier" = a stronger proprietary model (the savings ceiling).
  const APIS = [
    { label: "Qwen API", pricePerMtok: 0.50, kind: "same" },
    { label: "Z.ai / GLM", pricePerMtok: 0.60, kind: "same" },
    { label: "DeepSeek", pricePerMtok: 0.45, kind: "same" },
    { label: "Kimi / Moonshot", pricePerMtok: 1.00, kind: "same" },
    { label: "Mistral", pricePerMtok: 0.90, kind: "same" },
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
