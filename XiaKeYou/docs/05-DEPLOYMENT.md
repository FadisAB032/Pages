# 05 — 部署方案：GitHub Pages × Vercel × Render

## 推薦結論

1. **現在**：FadisAB032/Pages/XiaKeYou/ 的純靜態企劃頁沿用既有 GitHub Pages 目錄模式；本次不修改既有發布設定。
2. **可玩 MVP**：建議優先使用 Vercel 部署 Vite + Phaser 靜態前端，取得 PR Preview、自動建置與專屬網址。
3. **強烈希望前端只放 GitHub Pages 時**：可用 GitHub Actions 統合所有子目錄進行一次部署，不能只上傳新遊戲 dist 而覆蓋其他專案。
4. **需要登入／雲端存檔／多人時**：Render 放 Node.js API / WebSocket，搭配真正持久化的 PostgreSQL；單人遊戲保持離線可用。

## 平台分工

| 平台 | 適合承擔 | 不適合承擔 |
| --- | --- | --- |
| GitHub Pages | 公開靜態頁、Vite 編譯後資源、企劃頁 | Node API、持久 DB、WebSocket 伺服器 |
| Vercel | Vite 前端、Preview、自動化部署、靜態 CDN | 需要長時間常駐的房間／即時多人遊戲伺服器 |
| Render | Node API、WebSocket 服務、需常駐的進程 | 以 Free Web Service 保證無冷啟動的穩定即時體驗 |
| PostgreSQL（付費持久化） | 帳號、存檔與同步記錄 | 免費短期資料庫充當正式玩家資料保存 |

## A. 當前 GitHub Pages 展示頁

倉庫中已有 Bingo/ 與 Sudoku/，皆採直接 HTML/CSS/JS 靜態發布。
本次僅新增 XiaKeYou/index.html 與相對路徑的 style.css。

**若** Pages 已設定為 main 分支 /(root) 發布，預期展示 URL：

https://fadisab032.github.io/Pages/XiaKeYou/

這是預期路徑，**非本次已驗證部署成功的承諾**。若未啟用，至儲存庫 Settings → Pages → Build and deployment 選擇 Deploy from a branch → main → /(root)。

GitHub 官方文件：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## B. Vercel 可玩前端（M1 起推薦）

未來建議在 XiaKeYou/ 建立 pnpm workspace，下含 apps/web、packages/core、packages/shared。

Vercel Project 設定建議：

- Repository：FadisAB032/Pages
- Root Directory：XiaKeYou
- Framework Preset：Other 或 Vite（依最終 workspace 設定）
- Install Command：pnpm install --frozen-lockfile
- Build Command：pnpm --filter @xiakeyou/web build
- Output Directory：apps/web/dist
- Production Branch：main
- Preview：PR 自動預覽（連線後設定）
- Vite base：對 Vercel 的根網址使用 /

此處只提供設計參數，未建立 package.json，**目前不能執行上述 build**。
若改為單一 app 且無 workspace，可直接把 Vercel Root Directory 設成 XiaKeYou/apps/web，再以預設 Vite build。

Vercel 官方文件：https://vercel.com/docs/monorepos

## C. 將 Vite 遊戲改部署到同一個 GitHub Pages

GitHub Pages 每個 repo 是一個發布站點；此 repo 已含其他獨立專案。
切勿建立只部署 XiaKeYou/apps/web/dist 的 workflow，因為這會讓其他子目錄從產物中消失。

未來若要切換到 Actions 模式，建議：

1. 在暫存目錄 _site/ 複製 Bingo/、Sudoku/ 等已發布子目錄。
2. 產生 _site/index.html 連到每個站點。
3. 在 XiaKeYou workspace 執行 Vite build，設定 base 為 /Pages/XiaKeYou/。
4. 複製遊戲 dist/* 到 _site/XiaKeYou/。
5. 上傳 **整個 _site/** 為單一 Pages artifact，再執行 deploy-pages。
6. 驗證 Bingo、Sudoku、XiaKeYou 全部可訪問後才切換正式發布來源。

Vite 的 base 需因環境不同而切換：

- Vercel 專案根路徑：/
- 此 GitHub Pages 子路徑：/Pages/XiaKeYou/

本次**不新增、不啟用** Actions 工作流程，避免干擾既有專案。

GitHub 官方文件：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site  
Vite 官方文件：https://vite.dev/guide/static-deploy.html

## D. Render API（M6 起才建立）

未來可在 Render 建 Web Service：

- Root Directory：XiaKeYou（workspace）或 XiaKeYou/apps/api（API 獨立）
- Runtime：Node.js
- Build：依未來 API package 設定執行
- Start：執行編譯後服務；監聽 process.env.PORT 與 0.0.0.0
- API origin：由後端設定精確 CORS allowlist（正式網域與明確 Preview）
- Secrets：Render Environment Variables；不入庫、不出現在 Vite VITE_* 變數。
- DB：持久化 PostgreSQL，包含 migrations、權限、備份、還原演練。

### Render 免費方案限制（2026-10 查閱）

- Free Web Service 無流量約 15 分鐘後休眠，冷啟動可能約 1 分鐘。
- Free 服務檔案系統非持久；重部署、重啟或休眠後不能依賴本機檔案保留。
- Free Render Postgres 約 30 天到期；**不可拿來保存正式玩家進度**。
- 若要多人即時在線、常駐房間或玩家真實存檔，應預估付費服務及資料庫。

官方文件：https://render.com/docs/free

## E. 遷移原則

- 單人 MVP 不依賴 API；Render 斷線不應讓本地遊戲不可玩。
- 本機存檔可匯出，雲端同步採**明確上傳／下載 + 版本衝突**，不直接覆蓋。
- 所有環境都使用 HTTPS；跨網域認證與 CSRF／CORS 需一起設計。
- 正式域名確定前，先用預覽部署驗證 Browser base path、素材載入與路由。
