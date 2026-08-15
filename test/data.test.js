const { test } = require("node:test");
const assert = require("node:assert/strict");
const D = require("../assets/data.js");

test("GPUS has the measured A100 Secure default first", () => {
  assert.equal(D.GPUS[0].rate, 1.39);
  assert.match(D.GPUS[0].label, /A100.*Secure/);
});

test("APIS default (index 0) is the same open model, cheap tier", () => {
  assert.ok(D.APIS[0].pricePerMtok <= 1.0);
  assert.equal(D.APIS[0].kind, "same");
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

test("presets and default volume are present", () => {
  assert.deepEqual(D.PRESETS.medium, { hoursDay: 4, daysMonth: 22 });
  assert.equal(D.DEFAULT_VOLUME, 7);
});
