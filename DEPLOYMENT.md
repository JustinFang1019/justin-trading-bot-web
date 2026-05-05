# Deployment Guide

這個 project 目前的 Web 原型是純靜態網站：

- `index.html`
- 圖片與 Markdown 文件

所以可以很容易部署到免費或低成本平台。

## 最推薦：GitHub Pages

適合情境：

- 想快速給朋友試用。
- 不需要後端 API。
- 只要一個公開網址。

流程：

1. 在 GitHub 建一個新的 repository。
2. 把這個 project push 上去。
3. 到 GitHub repository 的 `Settings -> Pages`。
4. Source 選 `Deploy from a branch`。
5. Branch 選 `main`，folder 選 `/root`。
6. 幾十秒後會得到網址，例如：

```text
https://你的帳號.github.io/你的repo名稱/
```

優點：

- 免費。
- 很適合純 HTML。
- 之後改版只要 push。

限制：

- 如果 repo 是公開，別人可以看到原始碼。
- 不適合放 API key 或秘密資料。
- 若未來要接真資料，需要另外做後端或 API proxy。

## 也可用：Netlify

適合情境：

- 想拖拉上傳就產生網址。
- 想快速做 preview。

流程：

1. 登入 Netlify。
2. 選 `Add new site -> Deploy manually`。
3. 把整個 project 資料夾拖上去。
4. Netlify 會給一個公開網址。

優點：

- 最快。
- 不一定要先 push GitHub。

限制：

- 手動上傳更新比較麻煩。
- 如果未來要多人協作，還是建議接 GitHub。

## 也可用：Vercel / Cloudflare Pages

這兩個也能部署，但對目前單檔 HTML 原型來說有點超規格。

之後如果要改成 React / Next.js / API route，Vercel 會很適合。

## 如果要接真資料

目前可以公開，因為資料都是模擬資料。

未來如果接真資料，要注意：

- 不要把 `FINMIND_TOKEN` 放在前端。
- 不要把 `LINE_TOKEN` / `LINE_SECRET` 放在前端。
- 不要把 `GOOGLE_CREDENTIALS` 放在前端。
- 前端只能呼叫自己的後端 API。

建議架構：

```text
LINE Bot / Web UI
  -> 自己的後端 API
  -> FinMind / Google Sheets / TWSE / TPEX
```

## 我建議的下一步

第一個公開試用版建議用 GitHub Pages：

1. 先公開這個純前端原型。
2. 收朋友回饋 UI 和功能方向。
3. 確認方向後，再做後端 API 與 LIFF。
