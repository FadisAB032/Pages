# 03 — 系統架構與程式模組

## 決策摘要

| 層級 | MVP | 擴展時 |
| --- | --- | --- |
| Web | Vite + TypeScript + Phaser（2D 渲染、輸入、場景） | 同架構，視需求加 DOM UI 框架 |
| Game Core | 純 TypeScript 邏輯模組，不依賴 Phaser／DOM | 同一套規則可供 API 驗證與重播 |
| Content | JSON/TS data + schema 驗證 | 版本化內容包與編輯工具 |
| Save | IndexedDB（本機）；提供匯出／匯入 | Render API + 持久化 DB 的雲端同步 |
| API | **不存在**（MVP 無需） | Node.js + Fastify（HTTP／WebSocket） |
| Database | **不存在** | PostgreSQL，具備備份與付費持久化 |
| Test | Vitest 單元／性質測試 + Playwright E2E | API 整合、負載與多人同步測試 |
| Hosting | GitHub Pages 企劃頁；可玩 Vite 版建議 Vercel | Render API + Vercel / Pages frontend |

## 高階資料流

~~~text
Browser
  |
  +-- HTML / CSS HUD（任務、背包、角色／設定）
  |
  +-- Phaser Scene（地圖、人物、動畫、鍵盤／觸控）
          |
          v
      Game Controller（事件協調）
          |
          v
      Core Simulation（純 TypeScript）
        |        |            |
        |        |            +-- 戰鬥、任務、聲望、經濟規則
        |        +--------------- Seeded PRNG / 世界生成
        +------------------------ 定時 tick / NPC 事件
          |
          +-- Content Registry（原創資料表，schema 驗證）
          +-- Save Repository（IndexedDB；匯入／匯出）
          |
          +-- 可選的同步 Adapter（Phase 2+）
                  |
                  v
          Render API / WebSocket
                  |
                  v
             PostgreSQL
~~~

## 程式邊界

### packages/core（未來建立）

- WorldGenerator：由 seed 產生世界與區域索引；不含繪圖。
- GameClock：支援暫停、時間倍率、日／夜事件。
- QuestEngine：接單、進度更新、交付、失敗與獎勵。
- CombatSystem：戰鬥傷害與狀態計算；沒有直接 DOM 操作。
- ProgressionSystem：有效行為觸發能力成長、冷卻與遞減。
- NpcSystem：NPC 位置／關係／聲望條件與排程事件。
- SaveCodec：遊戲存檔格式、版本與遷移。

所有核心變更盡量經由明確的 command / event／reducer 更新，提升 deterministic 重播與測試能力。

### apps/web（未來建立）

- Scenes：BootScene、TownScene、FieldScene、DungeonScene。
- InputAdapter：鍵盤／觸控輸入統一為遊戲命令。
- Renderer：只根據核心狀態渲染地圖、角色、提示。
- HUD：HTML/CSS 為主，對話、背包、任務、設定。
- SaveAdapter：IndexedDB，紀錄 transaction／schemaVersion；讀取錯誤需可復原。
- RuntimeConfig：環境設定由建置環境注入，絕不置入私人密鑰。

### apps/api（Phase 2+）

- Fastify HTTP：health、帳號／session、存檔上傳與下載。
- WebSocket（未來）：多人房間、輸入命令、伺服器權威狀態。
- Service layer：存檔授權、版本衝突檢查、節流與審計。
- Persistence：PostgreSQL migrations／備份／復原。
- 只有需跨裝置或多人時才真正建立，以免提早維護沒有用途的後端。

## 種子與模擬可重現性

- 將 worldSeed、generationVersion 以及必要的派生 seed 保存。
- 不可在 core 內直接呼叫 Math.random；統一注入 seeded PRNG。
- 使用固定 tick（例如邏輯 20 Hz）使物理／計時與畫面 FPS 解耦。
- 客戶端時鐘只驅動模擬，不直接決定戰利品或任務隨機結果。
- 重大版本變更需定義存檔遷移或明確顯示不相容說明。
- 隨機生成地圖需檢查連通性與任務目標可達性。

## API 草案（尚未實作）

| 方法 | 路徑 | 目的 | 必要保護 |
| --- | --- | --- | --- |
| GET | /health | 健康檢查 | 不含敏感內容 |
| GET | /v1/saves | 列出本人存檔 | 登入、所有權驗證 |
| GET | /v1/saves/:id | 下載本人存檔 | 登入、所有權驗證 |
| PUT | /v1/saves/:id | 版本化覆蓋 | 驗證 schema、版本衝突 |
| POST | /v1/session | 登入工作流程（方式待定） | 限速、CSRF／認證設計 |

Cloud save 預定使用 optimistic concurrency，避免多裝置以最後寫入直接覆蓋較新的進度。不得相信客戶端傳入的 userId 即為已登入用戶。

## 部署與環境

- **MVP 無後端**。Github Pages / Vercel 的靜態站即可載入遊戲、執行核心邏輯與本機存檔。
- Vercel 特別適合此 repo 的獨立前端專案、Preview URL 與 Vite 建置。
- GitHub Pages 若要同時容納現有 Bingo / Sudoku，日後需在 repo 層安排**單一統合發佈**；不應只把新遊戲 dist 當成整個網站 artifact。
- Render API 需要真正的持久資料庫；Free 服務冷啟動與免費 DB 到期不適用正式存檔。

## 未來工作樹（未建立）

~~~text
XiaKeYou/
  apps/
    web/  (package.json, index.html, src/scenes/, src/ui/, src/adapters/)
    api/  (package.json, src/routes/, src/services/, src/db/)
  packages/
    core/  (src/world/, src/quests/, src/combat/, src/time/)
    shared/ (src/schemas/, src/types/)
  content/  (regions/, npcs/, monsters/, items/, quests/)
  docs/
  package.json
  pnpm-workspace.yaml
~~~

## ADR 原則

- 不在 Phaser Scene 內寫持久化業務規則。
- 不把 private key、DB password、OAuth secret 放進前端或 GitHub Pages。
- 不因為「未來可能多人」而讓單人遊戲必須保持 API 連線。
- 不以新增的 CI workflow 取代舊發布流程，除非已驗證 Bingo / Sudoku 能保留。
