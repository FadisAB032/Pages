# 俠客遊 Web RPG（XiaKeYou）

> 狀態：**企劃／技術設計階段（尚未實作可遊玩的 RPG）**  
> 建立日期：2026-10-25  
> 專案定位：受到經典自由冒險 RPG 啟發的**原創**繁體中文網頁沙盒 RPG。

## 專案目標

讓玩家在程序生成的奇幻世界中，選擇自己的冒險人生，而不是追隨強制主線。
核心循環：**探索城鎮 → 承接委託 → 野外冒險／戰鬥 → 成長與人際互動 → 自行訂立下一個人生目標**。

### 五項設計原則

1. **玩家主導**：沒有必須打倒的終極魔王；可透過多種活動發展角色。
2. **系統驅動**：使用種子、任務模板與世界狀態製造重玩性，而非單靠固定劇情。
3. **有記憶的世界**：NPC、聲望、陣營與時間能影響事件結果。
4. **先小而完整**：單人、離線可玩、有存檔的垂直切片優先。
5. **擴充但不早期過度設計**：後端、雲端存檔與多人連線都以後續階段實作。

## 目前這次交付了什麼？

- 此專案獨立放在 FadisAB032/Pages/XiaKeYou/，不修改 Bingo、Sudoku。
- index.html 與 style.css 是**企劃展示頁**，並非遊戲實作。
- docs/ 記錄可供實作的設計、技術、資料格式、部署、階段計畫與待辦。

## 文件導覽

| 檔案 | 用途 |
| --- | --- |
| [01-VISION.md](docs/01-VISION.md) | 產品定位、目標族群、設計原則與範圍 |
| [02-GAME-DESIGN.md](docs/02-GAME-DESIGN.md) | 世界、角色、任務、戰鬥、時間、NPC、存檔規則 |
| [03-ARCHITECTURE.md](docs/03-ARCHITECTURE.md) | 技術架構、模組邊界、資料流、前後端分工 |
| [04-ROADMAP.md](docs/04-ROADMAP.md) | 里程碑、可驗收標準、工作項目 |
| [05-DEPLOYMENT.md](docs/05-DEPLOYMENT.md) | GitHub Pages、Vercel、Render 部署方案與切換條件 |
| [06-DATA-SECURITY.md](docs/06-DATA-SECURITY.md) | 資料結構、存檔遷移、API 與安全性 |
| [07-DECISIONS.md](docs/07-DECISIONS.md) | 架構決策記錄及未決議題 |

## 建議專案結構（未來實作，尚未建立）

~~~text
Pages/
├── Bingo/                         # 既有專案，保持不變
├── Sudoku/                        # 既有專案，保持不變
└── XiaKeYou/
    ├── index.html                 # 目前：企劃展示入口
    ├── style.css                  # 目前：企劃展示樣式
    ├── docs/                      # 本次產出的企劃與技術文件
    ├── apps/
    │   ├── web/                   # 未來：Vite + TypeScript + Phaser
    │   └── api/                   # 未來：Fastify + WebSocket (Phase 2+)
    ├── packages/
    │   ├── core/                  # 未來：無 UI 依賴的遊戲規則引擎
    │   └── shared/                # 未來：型別與 schema
    └── content/                   # 未來：原創世界、道具、怪物與任務資料
~~~

## 部署策略

**當前**：企劃展示頁採相對路徑，可沿用既有 GitHub Pages 主分支根目錄發布方式；只有儲存庫已啟用此發布模式，才能訪問預期路徑 /Pages/XiaKeYou/。本次**沒有改變 GitHub Pages 設定**。

**可玩 MVP**：推薦 Vercel 部署 Vite 建置產物；若希望繼續使用 GitHub Pages，需將建置後靜態資源整合進整個 Pages 儲存庫的發布流程，以免覆蓋 Bingo 和 Sudoku。

**雲端階段**：僅在有帳號、同步或多人需求時，才把 Node.js API / WebSocket 放在 Render，並使用持久化資料庫。**不依賴 Render Free Postgres 作為正式存檔**。

## 名稱及著作權

「俠客遊」僅作開發階段暫定名稱／研究代號。專案以經典 RPG 的玩法設計作為靈感，**不複製原作的程式碼、角色、劇情、地圖、UI 素材、音樂、商標或可識別表現**。對外發行前應檢查名稱及素材權利，必要時改用原創正式名稱。

## 開發啟動點

優先完成 [04-ROADMAP.md](docs/04-ROADMAP.md) 的 M1–M3：小地圖探索、任務與戰鬥、可恢復的本地存檔。
