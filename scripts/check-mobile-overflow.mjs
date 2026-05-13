import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

const checks = [
  ["viewport meta", /<meta\s+name=["']viewport["'][^>]*width=device-width/i],
  ["html horizontal overflow guard", /html\s*{[\s\S]*?overflow-x:\s*hidden/i],
  ["body horizontal overflow guard", /body\s*{[\s\S]*?overflow-x:\s*hidden/i],
  ["mobile breakpoint 720", /@media\s*\(max-width:\s*720px\)/],
  ["mobile breakpoint 540", /@media\s*\(max-width:\s*540px\)/],
  ["tool controls max width", /\.tool-controls[\s\S]*?max-width:\s*100%/],
  ["mobile tool input single column", /@media\s*\(max-width:\s*720px\)[\s\S]*?\.tool-input-row\s*{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/],
  ["mobile range line single column", /@media\s*\(max-width:\s*720px\)[\s\S]*?\.range-line\s*{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/],
  ["mobile feature cards constrained two columns", /@media\s*\(max-width:\s*720px\)[\s\S]*?\.etf-feature-groups,[\s\S]*?\.etf-decision-grid,[\s\S]*?\.etf-monitor-grid,[\s\S]*?\.etf-reserved-grid\s*{[\s\S]*?max-width:\s*100%[\s\S]*?width:\s*100%[\s\S]*?\.etf-decision-grid,[\s\S]*?\.etf-monitor-grid,[\s\S]*?\.etf-reserved-grid\s*{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/],
  ["mobile metric pills stay grid", /\.metric-pills\s*{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/],
  ["category controls scroll", /\.filters\s*{[\s\S]*?overflow-x:\s*auto/],
  ["sort controls scroll", /\.etf-sort-row\s*{[\s\S]*?overflow-x:\s*auto/],
];

let failed = 0;

for (const [label, pattern] of checks) {
  if (pattern.test(html)) {
    console.log(`PASS ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL ${label}`);
  }
}

if (failed) {
  console.error(`Mobile overflow guard check failed: ${failed}/${checks.length}`);
  process.exit(1);
}

console.log(`PASS mobile overflow guard check: ${checks.length} checks`);
