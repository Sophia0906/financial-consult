# financial-consult 分析儀表板

一個 Claude Artifact（單檔 React JSX），提供五個分頁的投資分析介面：
今日概況／研究目標／配置健檢／投資靈感／歷史紀錄。

## 檔案

- `analyst-dashboard.jsx` — 儀表板主程式（單檔，無外部相依，僅用 lucide-react 圖示）

## 部署方式（重要）

此工具透過 Claude Artifact 的內建橋接呼叫 Claude API（`fetch https://api.anthropic.com/v1/messages`，
不需要 API key），並使用 `window.storage` 做帳號綁定的存檔。因此：

1. **必須在使用者本人登入的 Claude 對話中生成 Artifact** — 把 jsx 內容貼給 Claude 請它建立 artifact。
   分享連結給別人開啟會因為沒有橋接而失敗（Invalid response format）。
2. 存檔綁「帳號」不綁「裝置」— 換電腦、用手機開同帳號都能讀到歷史紀錄。
3. API 用量計入該帳號的訂閱方案額度；鏡頭依序執行並有 429 自動重試（4s／8s）。

## 儲存結構（window.storage）

- `analyses_index` — 研究目標的索引：`[{slug, displayTarget, lastTime, roundCount}]`
- `analyses:{slug}` — 單一標的的所有分析：`{displayTarget, rounds:[{time, lenses, results}]}`
- `saved_ideas` — 已釘選的投資靈感：`[{title, thesis, risk, time}]`
- `references` — 參考來源卡（消化後的重點，非原文全文）：`[{id, title, source, url, date, summary, tags, time}]`

## 參考來源（references）分頁

存放使用者從外部財經內容（KOL 貼文、文章等）消化後的「引用卡」——只存重點摘要、
關鍵數據與出處標籤，供本人研究時溯源引用，不存他人原文全文（轉化性使用）。
兩種產生方式：自己寫，或貼原文請 Claude 濃縮成摘要。標籤（股票代號／賽道關鍵字）
用於與「研究目標」連動：分析某標的時，工具會依標籤自動帶出相關參考卡當佐證。

## 待辦（規劃中，預計移交 Cowork 以真實檔案系統實作）

- 配置健檢的本機 .md 存檔與「與上次比對」
- 投資靈感三來源模式（一般／根據配置／根據今日概況）
- 今日概況改由 Cowork 排程任務每日自動產出 .md
- 參考來源卡同步成本機 .md 檔（每張卡一個 `references/日期_來源_標題.md`，由 Cowork 讀 `references` storage 匯出）

## 免責

僅供分析參考，不構成投資建議或交易指令。顧問視角（芒格／塔勒布／Naval）為
公開資料蒸餾的思維框架，非本人真實想法。
