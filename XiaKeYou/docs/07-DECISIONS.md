# 07 — 架構決策記錄（ADR Lite）

## ADR-001 — 放在既有 Pages 儲存庫

**狀態：Accepted（2026-10-25）**

選擇 FadisAB032/Pages/XiaKeYou/。目前 Bingo、Sudoku 為獨立靜態子專案，適合先新增隔離目錄。不得因新遊戲的建置／部署去覆蓋兩個既有目錄。

## ADR-002 — 先單人、離線、靜態站

**狀態：Accepted（2026-10-25）**

高自由度 RPG 的主要技術風險在遊戲規則、存檔與動態任務，而非登入系統。先讓遊戲能在靜態網站運作，不新增 Render 服務；正式上雲需由玩家需求觸發。

## ADR-003 — Phaser + Vite + TypeScript 與 Core 分離

**狀態：Proposed（待 M1 原型實測）**

Phaser 提供 2D 場景、Tilemap、輸入與渲染；Vite 負責編譯，TypeScript 強化規則與存檔型別。世界、任務、戰鬥核心不依賴 Phaser，方便測試及日後伺服器權威化。

替代方案：PixiJS + 自製 ECS（自由但工作量較高）、Godot Web Export（工具完整但與既有網頁共用環境較複雜）。以 M1 實作驗證選型。

## ADR-004 — Vercel 作為可玩版本的優先部署候選

**狀態：Proposed（待 M1 build 建立）**

GitHub Pages 可部署 Vite 編譯後檔案，但既有多子目錄需整合發布。Vercel 容易為 XiaKeYou 設獨立 build／Preview，避免改動 Bingo、Sudoku 發布流程。若使用者堅持 GitHub Pages，可透過統合 CI 達成。

## ADR-005 — 雲端存檔採同步 Adapter

**狀態：Proposed（M6 才實作）**

Core 僅操作 SaveRepository 介面，MVP 實作 IndexedDB，未來可增加 Render API adapter。雲端採 revision 衝突控制，不默默以最後寫入為準。

## ADR-006 — Render 不承載正式免費 Postgres 存檔

**狀態：Accepted（2026-10-25）**

Render Free Postgres 有到期限制，Free Web Service 會休眠；避免把它們用於正式不可遺失玩家資料。若啟用雲端應使用可靠持久化方案及備份策略。

## 開放議題

1. 正式對外遊戲名稱：保留「俠客遊」為暫定研究名，公開前查明商標及品牌風險。
2. 美術風格：2D 像素、低解析 2.5D、或手繪地圖 UI；先用自製占位資產。
3. 戰鬥方式：M1 原型驗證即時攻擊手感、觸控操作難度。
4. 行動裝置：優先全面支援，或第一版限制桌面最佳體驗。
5. 城鎮及 NPC 世界觀：M1 需先有可延伸的原創命名系統。
6. 正式部署域名：Pages 與 Vercel 不應同時標示為玩家主要入口。
