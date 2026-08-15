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
