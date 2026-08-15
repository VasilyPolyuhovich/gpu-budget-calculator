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

test("tokensPerSeatMtok uses the stated assumption (Mtok)", () => {
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
