# trading-agent — 股票／加密貨幣交易 Agent 起步骨架

這是一個「先模擬、後真錢」的交易 agent 骨架。核心設計原則:

1. **同一套程式碼跑回測、模擬盤、真實盤** — 策略與風控不知道自己接的是哪種券商,
   只透過 `Broker` 介面下單。從回測走到真錢,只是換掉 adapter,邏輯零改動。
2. **預設永遠是模擬** — 不設定 API key、不把 `mode` 明確改成 `live`,程式碼路徑
   根本碰不到真實下單。真錢模式需要同時滿足兩個開關(config + 環境變數),防呆。
3. **風控是獨立的一層** — 策略只「建議」,風控有一票否決權:單筆上限、持倉比例
   上限、當日虧損熔斷(kill switch)、標的白名單。

## 架構

```
DataFeed(行情) ──► Strategy(訊號) ──► RiskManager(否決權) ──► Broker(執行)
                                                                │
                                              Journal(交易日誌) ◄┘
```

```
trading-agent/
├── run.py                 # 模擬盤／真實盤入口(輪詢迴圈)
├── backtest.py            # 回測入口(離線可跑,不需網路與 API key)
├── config.toml            # 策略、風控、模式設定
├── .env.example           # API key 範本(真正的 key 放 .env,已被 gitignore)
└── agent/
    ├── models.py          # Bar / Order / Position / Fill 資料結構
    ├── config.py          # 讀取 config.toml + 環境變數
    ├── risk.py            # 風控:一票否決 + 當日虧損熔斷
    ├── journal.py         # 交易日誌(JSONL,回測與實盤共用)
    ├── data/
    │   ├── feed.py        # DataFeed 介面 + SyntheticFeed(離線隨機走勢)
    │   └── ccxt_feed.py   # 加密貨幣行情(ccxt 公開端點,不需 key)
    ├── brokers/
    │   ├── base.py        # Broker 介面
    │   ├── paper.py       # 模擬券商(模擬成交、追蹤現金與持倉)
    │   ├── ccxt_broker.py # 加密貨幣實單(ccxt;預設接 Binance testnet)
    │   └── alpaca_broker.py # 美股(alpaca-py;預設接 paper endpoint)
    ├── indicators.py      # 串流式 SMA / RSI / ATR(零依賴)
    ├── metrics.py         # 績效指標:回撤、勝率、獲利因子、Sharpe
    └── strategy/
        ├── base.py        # Strategy 介面(含 on_fill / on_reject 回饋)
        ├── registry.py    # 策略註冊表
        ├── sma_cross.py   # 雙均線交叉(最陽春的自建策略)
        ├── grid.py        # 網格機器人(對照組:交易所現成機器人)
        └── rule_stack.py  # 規則堆疊(可解釋的多條件策略)
```

## 快速開始(完全離線,不需任何帳號)

```bash
cd trading-agent
python3 compare.py                        # 四方 PK:抱著不動 vs 網格 vs 雙均線 vs 規則堆疊
python3 compare.py --explain rule_stack   # 逐筆看「它為什麼買、為什麼賣」
python3 backtest.py                       # 單一策略回測 + 完整績效
python3 run.py --mode paper --feed synthetic   # 模擬盤迴圈(Ctrl+C 停止)
```

## 看得見的買賣邏輯

策略送出的每個建議都帶 `evidence`(判斷依據),會印在終端機、也會寫進交易日誌。
`--explain` 的輸出長這樣:

```
[2026-08-03 12:12] BUY  BTC/USDT — 四項進場條件全數成立
   ├ ✓ 趨勢向上:收盤 106.07 > SMA50 104.21
   ├ ✓ 動能有力:RSI14 51.1 > 45
   ├ ✓ 動能未過熱:RSI14 51.1 < 72
   ├ ✓ 波動可控:ATR 佔價格 1.18% < 3.00%
   └ ✓ 已過冷卻期:出場後 9999 根 >= 5 根
   → 風控:通過:開倉/加倉 → 成交 9.427594 @ 106.12,權益 9998.50
```

沒進場的時候也看得到原因——策略會統計「是被哪個條件擋下來的」,這是調參最有用的
線索(例如發現九成的機會都卡在「趨勢向上」,那該檢討的是趨勢定義,不是停損點)。

這正是自建 agent 對比現成機器人的核心差異:**邏輯不是黑箱,每個決定都能溯源與改進**。

## 為什麼要有 compare.py

自建策略不是自動比較好。`compare.py` 逼你誠實面對:你寫的東西打不打得贏
(a) 買進後抱著不動、(b) 交易所點兩下就能開的網格機器人。打不贏就別自建,
省下的時間拿去研究策略本身。

比較的公平性由三件事保證:所有策略跑**完全相同**的 K 線(先生成一次再重播)、
相同的手續費與滑價、相同的風控參數。`--seeds N` 可以換 N 組不同資料重跑取平均——
只在單一組資料上贏,通常是運氣或過擬合。

### 骨架附的範例結果(合成資料,6 組亂數平均)

| 策略 | 報酬 | 最大回撤 | 成交數 | 勝率 | 手續費 |
|---|---|---|---|---|---|
| buy_and_hold | -4.76% | 45.40% | 1 | — | 10.00 |
| grid(現成機器人) | -6.53% | 13.55% | 218 | 61% | 109.99 |
| sma_cross | -2.91% | 5.45% | 78 | 31% | 76.83 |
| rule_stack | -1.59% | 5.21% | 70 | 25% | 69.57 |

**四個策略全部是負報酬,這是刻意保留的結果。** 合成資料本質是隨機漫步,沒有可
提取的規律,手續費和滑價又持續扣血——在這種資料上「跑出正報酬」只代表參數被調到
剛好貼合那組亂數,也就是過擬合。這張表能證明的是管線正確、以及策略行為的差異
(網格交易 3 倍次數、付 1.6 倍手續費;有出場機制的策略回撤只有抱著不動的九分之一),
不能證明任何策略會賺錢。要看真實績效,請換成 ccxt 抓下來的真實行情重跑。

順帶一提,`rule_stack` 從 -2.87% 改善到 -1.59% 是這樣來的:`--explain` 的輸出顯示
它每次只抱 2~4 根 K 線就出場,因為進場條件(收盤 > SMA)和出場條件(收盤 < SMA)
互為鏡像,價格貼著均線就來回洗。加一個 1.5% 的出場緩衝帶後,交易次數砍半、
手續費少四成。**這就是可解釋性的實際價值——看得到問題出在哪,才改得動。**

## 三階段路線圖

### 第一階段:回測 + 模擬盤(現在)
- 跑 `backtest.py` 驗證策略邏輯,看 `journal/` 下的交易紀錄。
- 把 `SyntheticFeed` 換成 `CCXTFeed` 拿真實行情(公開端點、免 key):
  `python3 run.py --mode paper --feed ccxt --symbol BTC/USDT`
- 這個階段的目標:策略在真實行情的模擬盤上跑滿幾週,數據說服你自己。

### 第二階段:交易所測試網(假錢、真 API)
- 加密貨幣:Binance Testnet(https://testnet.binance.vision)申請測試 key,
  填入 `.env`,`mode: testnet`。走的是真實下單 API,但都是假錢。
- 美股:Alpaca(https://alpaca.markets)的 paper trading 帳戶,同樣真 API 假錢。
- 這個階段驗證的是**執行層**:滑價、部分成交、API 斷線重連、時間同步。

### 第三階段:小額真錢
- 確認前兩階段的日誌無異常後,`mode: live` + 環境變數 `TRADING_AGENT_ARM_LIVE=1`
  雙開關才會啟用真實下單,並強烈建議從你「全部虧光也不心疼」的金額開始。
- 台股方面:多數台灣券商 API(如永豐金 Shioaji、富邦新一代 API)需要簽署 API
  使用同意書與程式交易風險預告書,申請後寫一個新的 `Broker` adapter 即可接入,
  策略與風控層完全不用動。

## 安全與現實提醒

- **API key 權限最小化**:交易所 key 只開「現貨交易」,永遠不開「提幣」權限,
  並綁定 IP 白名單。key 只放 `.env`,絕不進 git。
- **風控參數先於策略**:`config.toml` 裡的 `max_daily_loss_pct` 熔斷是最後防線,
  觸發後 agent 當日拒絕所有新單,只允許出場。
- 回測賺錢 ≠ 實盤賺錢:注意過擬合、手續費、滑價、資料倖存者偏差。
- 法規與稅務:程式交易在台灣需向券商申報;加密貨幣所得申報義務也請自行確認。
- 本骨架僅供學習研究,不構成投資建議;真錢損益自負。

## 依賴

核心(回測、模擬盤、合成資料)**零外部依賴**,Python 3.10+ 直接跑。
接真實行情或交易所時再裝:

```bash
pip install ccxt        # 加密貨幣(行情 + 下單)
pip install alpaca-py   # 美股
```
