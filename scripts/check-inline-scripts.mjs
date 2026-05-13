import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1].trim())
  .filter(Boolean);

let failed = 0;

for (const [index, script] of scripts.entries()) {
  try {
    new Function(script);
  } catch (error) {
    failed += 1;
    console.error(`FAIL inline script #${index + 1}: ${error.message}`);
  }
}

if (failed) {
  console.error(`Inline script syntax check failed: ${failed}/${scripts.length}`);
  process.exit(1);
}

console.log(`PASS inline script syntax: ${scripts.length} script block(s)`);
