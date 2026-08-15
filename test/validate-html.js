// Usage: node test/validate-html.js <file.html> [...]
// Checks: every data-i18n* key exists in both I18N.uk and I18N.en;
// every $("id") referenced in the page's inline scripts has a matching element id.
const fs = require("fs");
const { I18N } = require("../assets/i18n.js");
let bad = 0;
for (const file of process.argv.slice(2)) {
  const html = fs.readFileSync(file, "utf8");
  const script = (html.match(/<script>([\s\S]*?)<\/script>/g) || []).join("\n");
  const markup = html.replace(/<script>[\s\S]*?<\/script>/g, "");
  const keys = [...new Set([...markup.matchAll(/data-i18n(?:-html|-aria)?="([^"]+)"/g)].map((m) => m[1]))];
  const missing = keys.filter((k) => I18N.uk[k] == null || I18N.en[k] == null);
  const ids = new Set([...markup.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  const refIds = [...new Set([...script.matchAll(/\$\("([^"]+)"\)/g)].map((m) => m[1]))];
  const missingIds = refIds.filter((i) => !ids.has(i));
  if (missing.length || missingIds.length) {
    bad++;
    console.error(`${file}: missing i18n keys=${JSON.stringify(missing)} missing ids=${JSON.stringify(missingIds)}`);
  } else {
    console.log(`${file} OK (${keys.length} i18n keys, ${refIds.length} script ids)`);
  }
}
process.exit(bad ? 1 : 0);
