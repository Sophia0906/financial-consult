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
    └── strategy/
        ├── base.py        # Strategy 介面
        └── sma_cross.py   # 範例策略:雙均線交叉
```

## 快速開始(完全離線,不需任何帳號)

```bash
cd trading-agent
python3 backtest.py                 # 用合成資料回測範例策略
python3 run.py --mode paper --feed synthetic   # 模擬盤迴圈(Ctrl+C 停止)
```

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
