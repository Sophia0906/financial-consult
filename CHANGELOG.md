# 版本紀錄 CHANGELOG

記錄兩件事：儀表板 artifact 本身的版本，以及它依賴的外部 nuwa 顧問 skill 版本。
每次更新往最上面加一行。

---

## Artifact 版本

| 版本 | 日期 | 變更 |
|------|------|------|
| v7.2 | 2026-07-14 | 顧問團三位加上像素頭像（芒格/塔勒布/Naval，base64 內嵌）|
| v7.1 | 2026-07-14 | 參考來源標籤改兩層：賽道（固定清單、上頂部篩選）＋標的（自由輸入、供連動）；標題改「蒸餾你的分析師」|
| v7.0 | 2026-07-14 | 新增參考來源分頁（引用卡：摘要＋出處＋標籤，可與研究目標連動）|
| v6.0 | 2026-07-13 | 深/淺色切換、字體三段調整、版本徽章、檢查更新按鈕 |
| v5   | 2026-07-13 | 五分頁重整、投資靈感三卡可 pin、歷史紀錄二層折疊、依序執行＋重試 |

## 依賴的 nuwa 顧問 skill

顧問團的思維框架來自 nuwa 蒸餾的獨立 skill。這些 skill 會各自進化，
更新時在 Cowork 重跑 `npx skills add`，並在這裡記下同步日期。

| 顧問 | skill repo | 一鍵安裝 | 本地同步日期 |
|------|-----------|---------|------------|
| 芒格 | alchaincyf/munger-skill | `npx skills add alchaincyf/munger-skill` | 尚未安裝 |
| 塔勒布 | alchaincyf/taleb-skill | `npx skills add alchaincyf/taleb-skill` | 尚未安裝 |
| Naval | alchaincyf/naval-skill | `npx skills add alchaincyf/naval-skill` | 尚未安裝 |

## Cowork skill（本專案自製）

| skill | 用途 | 版本 | 日期 |
|-------|------|------|------|
| financial-analyst | 分析標的並寫成本機 .md（一標的一檔累加），可呼叫上述 nuwa 顧問 skill | v1.0 | 2026-07-14 |

---

## 更新流程備忘

1. 在 Claude 對話裡改 artifact → 推上 GitHub → 在此表加一行 artifact 版本
2. nuwa 更新某顧問 skill → 在 Cowork 重跑 `npx skills add` → 在此表更新「本地同步日期」
3. artifact 的「檢查更新」按鈕會複製一句指令，貼給 Cowork 即可 pull 最新版並重建
