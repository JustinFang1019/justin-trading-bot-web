import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

const checks = [
  ["viewport meta", /<meta\s+name=["']viewport["'][^>]*width=device-width/i],
  ["html horizontal overflow guard", /html\s*{[\s\S]*?overflow-x:\s*hidden/i],
  ["body horizontal overflow guard", /body\s*{[\s\S]*?overflow-x:\s*hidden/i],
  ["mobile breakpoint 720", /@media\s*\(max-width:\s*720px\)/],
  ["mobile breakpoint 540", /@media\s*\(max-width:\s*540px\)/],
  ["runtime overflow guard css", /\.mobile-overflow-guard/],
  ["runtime overflow guard function", /function\s+checkMobileOverflow/],
  ["render overflow check: scan feed", /checkMobileOverflow\(["']scan-feed["']\)/],
  ["render overflow check: ranking", /checkMobileOverflow\(["']etf-ranking["']\)/],
  ["render overflow check: activate", /checkMobileOverflow\(`activate:\$\{viewId\}`\)/],
  ["render overflow check: tool page", /checkMobileOverflow\(`tool:\$\{tool\}`\)/],
  ["tool controls max width", /\.tool-controls[\s\S]*?max-width:\s*100%/],
  ["mobile tool input single column", /@media\s*\(max-width:\s*720px\)[\s\S]*?\.tool-input-row\s*{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/],
  ["mobile range line single column", /@media\s*\(max-width:\s*720px\)[\s\S]*?\.range-line\s*{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/],
  ["mobile feature cards original two columns", /@media\s*\(max-width:\s*720px\)[\s\S]*?\.etf-decision-grid,[\s\S]*?\.etf-reserved-grid\s*{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)[\s\S]*?\.etf-monitor-grid\s*{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/],
  ["mobile metric pills guarded", /\.mobile-overflow-guard\s+\.metric-pills/],
  ["mobile decision metrics guarded", /\.mobile-overflow-guard\s+\.decision-metrics/],
  ["mobile rotation metrics guarded", /\.mobile-overflow-guard\s+\.rotation-metrics/],
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
