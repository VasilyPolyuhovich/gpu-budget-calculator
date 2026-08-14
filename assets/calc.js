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
