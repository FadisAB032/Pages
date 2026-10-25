# 06 — 資料模型、測試與安全

## 資料模型 v0.1

### World

- worldId：本機唯一識別碼，不等於公開世界名稱。
- seed：64-bit seed 以字串表示，避免 JSON Number 精度問題。
- generationVersion：地圖生成演算法版本。
- worldTime：遊戲時間 ticks，整數。
- regions：regionId、地形、連結、資源狀態、探索狀態。
- questPool：可接委託及其穩定識別碼。
- npcStates：NPC 位置、好感、聲望影響及必要事件記錄。

### Player

- playerId、displayName、origin（虛構出生背景）。
- regionId、position、facing。
- stats：體魄、身手、精神、生命值、耐力等。
- inventory：itemDefId、instanceId、quantity、attributes。
- equipment：裝備槽和對應 item instanceId。
- activeQuests、completedQuestIds、reputation。
- flags：已觸發事件與對話決策。

### Quest

- questId、templateId、issuerNpcId、targetRegionId。
- objectives：每一項任務目標及 current/required。
- status：available / active / ready / completed / failed / abandoned。
- reward：gold、items、reputation。
- createdAtTick、deadlineTick（選填）、generationSeed。
- 已結算的任務不可重複發放獎勵。

### SaveEnvelope

~~~json
{
  "schemaVersion": 1,
  "gameVersion": "0.1.0-dev",
  "saveId": "local-slot-1",
  "revision": 4,
  "savedAt": "2026-10-25T00:00:00.000Z",
  "state": {
    "world": {"seed": "20261025", "generationVersion": 1, "worldTime": 1200},
    "player": {"regionId": "town-01", "position": {"x": 4, "y": 9}},
    "quests": []
  }
}
~~~

上述 JSON 是**說明性草案**，實作時需補足欄位並由 Zod 或同等 schema 工具驗證，不能視為正式可匯入格式。

## 儲存規則

- IndexedDB 以 transaction 儲存完整有效 snapshot，避免部分欄位更新造成損壞。
- 預設僅寫入本機；首次使用應明確提醒無痕模式、瀏覽器清資料與裝置更換可能造成遺失。
- 使用 schemaVersion 判斷與執行遷移；無法遷移時保留原始檔，提供匯出／錯誤資訊。
- 自動儲存採節流（事件後或固定間隔），切換場景與重要任務完成時觸發。
- 存檔讀取前驗證物品數量、任務狀態、座標與關聯性；避免異常資料讓主循環卡死。
- 將來雲端同步：以 revision/etag 進行 optimistic concurrency，明確處理 409 Conflict。
- 初次公開測試前完成匯入／匯出與至少一個回溯測試。

## 資安與反作弊

### MVP（離線遊戲）

- 不宣稱能防止玩家竄改本機進度；這是單人遊戲的合理限制。
- 避免把任意任務對話 HTML 直接寫入 innerHTML；內容資料應以安全文字節點顯示。
- 遊戲 seed 不包含任何敏感資訊。
- 沒有登入服務就不蒐集可識別玩家資料或設置多餘追蹤。
- 原始素材及第三方資產必須有清楚授權和 attribution（如授權要求）。

### 多人／雲端（未來）

- 伺服器驗證存檔所屬者，不能只檢查前端傳入的 playerId。
- 伺服器權威判定戰鬥、獎勵、位置和任務；不相信客戶端聲稱的勝利／獲得道具。
- Rate limiting、body size、schema validation、請求記錄及錯誤回應的資訊最小化。
- DB 僅允許受限帳號連線；環境秘密由 Render 管理，輪換與備份分離。
- CORS 限制明確網域；Cookie、SameSite、CSRF 與登入策略須一起驗證。
- 逐步建立資料刪除、帳戶撤銷、未成年人保護與隱私政策。

## 自動化測試清單

- 相同 seed、相同 generator 版本得到相同區域拓樸與任務分派。
- 對多組 seeds 跑地圖連通性與委託可達性測試。
- 重複交付已完成任務不會複製金錢與物品。
- 存檔保存後重新讀取的核心狀態完全一致。
- schemaVersion 由 v1 遷移到新版本的測試。
- 重新整理頁面不會讓任務和 NPC 回到錯誤狀態。
- 回城、死亡、裝備更換及讀檔時不能產生非法背包數量。
- 失去 IndexedDB 權限或容量不足時有可理解的失敗提示。
- UI E2E 覆蓋鍵盤操作、任務閉環與載入舊存檔。

## 內容授權

- 原則：僅使用自行創作、CC0 或明確允許該用途的授權素材。
- 對需要署名的素材，在資產清單與遊戲頁面記載來源與授權條款。
- 不下載、重製或直接轉描經典遊戲的商標、美術、地圖、文本、音效。
