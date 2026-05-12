import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const sourceRoot = join(root, "source");

const uiSource = await readFile(join(sourceRoot, "justin_ui_redesign.html"), "utf8");
const featureSource = await readFile(join(sourceRoot, "justin_features_mockup.html"), "utf8");

const uiStyle = uiSource.match(/<style>[\s\S]*?<\/style>/)?.[0] || "";
const featureStyle = featureSource.match(/<style>[\s\S]*?<\/style>/)?.[0] || "";
const uiSections = uiSource.match(/<section class="section">[\s\S]*?<\/section>/g) || [];
const featureArticles = featureSource.match(/<article class="feature">[\s\S]*?<\/article>/g) || [];

const etfPages = [
  ["a01-etf-first-screen-density", "A01", "ETF 首屏資訊密度"],
  ["a02-etf-tool-grid-hierarchy", "A02", "ETF 工具網格分層"],
  ["a03-etf-ranking-row", "A03", "ETF 排名列決策資訊"],
  ["a04-etf-detail-hero", "A04", "ETF 詳細頁 Hero"],
];

const featurePages = [
  ["b01-watchlist-push", "B01", "自選 + 客製推播", "目前股票 / ETF 卡片已有查詢與 +自選概念，但缺少跨頁同步、推播條件與預覽。"],
  ["b02-market-dashboard", "B02", "首頁大盤儀表板", "目前進站以掃描列表為主，要自己從個股卡判斷今日盤勢。"],
  ["b03-strategy-hit-rate", "B03", "策略 hit-rate 回顧", "目前 START / CONT / RS90+ 是當下訊號，尚未把近 30 日勝率整理成頁面。"],
  ["b04-portfolio-simulator", "B04", "投組模擬器", "目前 ETF 比較偏單檔對照，還沒有輸入比例後計算整體投組。"],
  ["b05-institutional-flow", "B05", "法人籌碼整合", "目前個股詳情重點在策略、K 線、權證，法人買賣超尚未進入卡片。"],
  ["b06-etf-rebalance-radar", "B06", "ETF 季調換股雷達", "目前 ETF 詳細頁看已發生的持股變化，尚未預測季調納入或剔除。"],
  ["b07-dividend-calculator", "B07", "配息試算 + 填息歷史", "目前 ETF 有殖利率與配息日期，尚未換算個人入帳金額與填息天數。"],
  ["b08-card-share", "B08", "卡片一鍵分享", "目前可查看 LINE 風格卡片，但分享仍依賴手動截圖或複製網址。"],
  ["b09-watchlist-groups", "B09", "自選分組", "目前自選若擴大後會混在同一份清單，短線、長持、觀察目的不易分開。"],
  ["b10-dark-mode", "B10", "深色模式", "目前整體是淺色介面，長時間盯盤缺少低光環境模式。"],
  ["b11-position-calculator", "B11", "部位試算器", "目前個股頁有進場與停損相關資訊，但還沒把資金風險換算成張數。"],
  ["b12-natural-language-query", "B12", "自然語言查詢", "目前進階篩選需要理解欄位與條件，尚未支援中文自然語句。"],
  ["b13-theme-rotation-radar", "B13", "同主題輪動雷達", "目前 ETF 以單檔與分類查詢為主，缺少主題資金輪動視角。"],
];

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function writeShell(title, body, extraStyle = "") {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} - 實際預覽</title>
${extraStyle}
</head>
<body>
${body}
</body>
</html>`;
}

function etfPage(slug, code, title, sectionHtml) {
  return writeShell(`${code} ${title}`, `
<header class="page">
  <h1>${esc(code)} ${esc(title)}</h1>
  <p>這頁使用你提供的 ETF 新舊對照 mockup 原始 UI，左右都是實際手機畫面。</p>
</header>
<div class="container">
${sectionHtml}
<p class="footnote"><a href="./index.html">回預覽總覽</a>　<a href="../../index.html">回目前 Web 原型</a></p>
</div>`, uiStyle);
}

function beforePhone(title, lead) {
  return `<article class="feature before-feature">
    <div class="ftitle"><span class="num">OLD</span><h2>目前狀態 / 缺口</h2></div>
    <p class="why">${esc(lead)}</p>
    <div class="phone"><div class="screen"><div class="scroll">
      <div class="topbar"><button class="menu">≡</button><h1>${esc(title)}</h1><span class="chip blue">現有</span></div>
      <div class="panel">
        <div class="panel-title">目前可用</div>
        <div class="row"><div><div class="code">個股查詢</div><div class="name">LINE 卡片、K 線、權證、策略訊號</div></div><span class="chip">已上線</span></div>
        <div class="row"><div><div class="code">ETF 研究</div><div class="name">排名、比較、持股、資金流、配息日曆</div></div><span class="chip">已上線</span></div>
      </div>
      <div class="panel" style="background:#fff7ed;border-color:#fed7aa">
        <div class="panel-title" style="color:#9a3412">待補功能</div>
        <div style="font-size:12px;color:#7c2d12;line-height:1.55;margin-top:5px">${esc(lead)}</div>
      </div>
      <div class="panel">
        <div class="panel-title">建議接法</div>
        <div class="panel-sub">前端新增 view / panel；寫入、推播、資料快取交給 Flask /api/web 後端。</div>
      </div>
    </div></div></div>
  </article>`;
}

function featurePage(slug, code, title, articleHtml, oldLead) {
  const style = `${featureStyle}
<style>
  .compare-page .page-actions{max-width:1180px;margin:0 auto;padding:0 18px 18px;font-size:13px}
  .compare-page .page-actions a{color:var(--blue);font-weight:800;text-decoration:none}
  .compare-pair{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}
  .before-feature{background:rgba(255,255,255,.4);border-radius:14px;padding:14px 12px 18px}
  .before-feature .num{background:#64748b}
  @media (max-width:880px){.compare-pair{grid-template-columns:1fr}}
</style>`;

  return writeShell(`${code} ${title}`, `
<div class="compare-page">
  <header class="page">
    <h1>${esc(code)} ${esc(title)} - 實際畫面預覽</h1>
    <p>左側是目前缺口的實際 UI 狀態，右側是新功能 mockup 的實際生成畫面。</p>
  </header>
  <div class="container">
    <div class="compare-pair">
      ${beforePhone(title, oldLead)}
      ${articleHtml}
    </div>
  </div>
  <div class="page-actions"><a href="./index.html">回預覽總覽</a>　<a href="../../index.html">回目前 Web 原型</a></div>
</div>`, style);
}

function indexPage() {
  const cards = [
    ...etfPages.map(([slug, code, title]) => ({ slug, code, title, group: "ETF UI 重構" })),
    ...featurePages.map(([slug, code, title]) => ({ slug, code, title, group: "13 個新功能" })),
  ];
  const style = `<style>
  :root{--bg:#eef2f7;--surface:#fff;--ink:#182230;--muted:#667085;--line:#d9e1ec;--blue:#1d4ed8;--amber:#a16207;--amber-soft:#fef3c7}
  *{box-sizing:border-box}
  body{margin:0;background:#dfe4ec;color:var(--ink);font-family:"Microsoft JhengHei","Noto Sans TC","Segoe UI",Arial,sans-serif}
  header,main{max-width:1120px;margin:0 auto;padding:26px 18px 0}
  h1{margin:0 0 6px;font-size:26px}
  p{margin:0;color:#475467;line-height:1.6}
  .grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:18px 0 30px}
  .card{display:block;background:#fff;border:1px solid var(--line);border-radius:8px;padding:13px;min-height:124px;color:inherit;text-decoration:none;box-shadow:0 1px 2px rgba(16,24,40,.04)}
  .card:hover{border-color:#93c5fd;transform:translateY(-1px)}
  .code{color:var(--blue);font-size:12px;font-weight:900;letter-spacing:.7px}
  h2{margin:7px 0 7px;font-size:16px;line-height:1.35}
  .group{display:inline-flex;padding:2px 7px;border-radius:999px;background:var(--amber-soft);color:var(--amber);font-size:11px;font-weight:900}
  .desc{margin-top:8px;color:var(--muted);font-size:12.5px;line-height:1.5}
  @media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:560px){header,main{padding-left:14px;padding-right:14px}.grid{grid-template-columns:1fr}h1{font-size:22px}}
  </style>`;
  return writeShell("Justin Trading Bot - 實際新舊預覽", `
<header>
  <h1>Justin Trading Bot - 實際新舊預覽</h1>
  <p>這版不是文字說明卡，而是實際手機 UI 預覽。ETF 4 頁使用原始新舊對照；13 個新功能使用 mockup 實際畫面。</p>
</header>
<main>
  <section class="grid">
    ${cards.map(card => `<a class="card" href="./${card.slug}.html"><span class="code">${card.code}</span><h2>${esc(card.title)}</h2><span class="group">${esc(card.group)}</span><p class="desc">打開看 before / after 實際手機畫面。</p></a>`).join("")}
  </section>
</main>`, style);
}

await mkdir(root, { recursive: true });

for (let index = 0; index < etfPages.length; index += 1) {
  const [slug, code, title] = etfPages[index];
  await writeFile(join(root, `${slug}.html`), etfPage(slug, code, title, uiSections[index] || ""), "utf8");
}

for (let index = 0; index < featurePages.length; index += 1) {
  const [slug, code, title, oldLead] = featurePages[index];
  await writeFile(join(root, `${slug}.html`), featurePage(slug, code, title, featureArticles[index] || "", oldLead), "utf8");
}

await writeFile(join(root, "index.html"), indexPage(), "utf8");
console.log(`Generated actual UI previews: ${etfPages.length + featurePages.length + 1}`);
