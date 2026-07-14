import React, { useState, useEffect, useRef } from 'react';
import {
  Activity, Search, FileText, Layers, Lightbulb, PieChart,
  Scale, AlertTriangle, Compass,
  Loader2, History, Trash2, ChevronDown, Play, RotateCcw, Check, Pin, ArrowUpRight,
  Sun, Moon, RefreshCw, BookMarked, Sparkles, Plus, Link2,
} from 'lucide-react';

/* ============================================================
   Version — bump this on every push to GitHub
   ============================================================ */
const APP_VERSION = 'v7.2';
const APP_DATE = '2026-07-14';

/* ============================================================
   Advisor avatars (96px pixel-art, PNG base64, ~15KB total)
   ============================================================ */
const AVATARS = {
  munger: 'data:image/png;base64,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',
  taleb: 'data:image/png;base64,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',
  naval: 'data:image/png;base64,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',
};
const REPO_URL = 'https://github.com/Sophia0906/financial-consult';
const UPDATE_INSTRUCTION =
  `請從 ${REPO_URL} pull 最新版本，讀取 analyst-dashboard.jsx 開頭的 APP_VERSION，` +
  `如果比 ${APP_VERSION} 新，就用最新的檔案內容重新建立這個儀表板 artifact。我目前的版本是 ${APP_VERSION}（${APP_DATE}）。`;

/* ============================================================
   Theming — all colors are CSS variables so dark/light is one class swap
   ============================================================ */
const FONT_SANS = "'IBM Plex Sans', -apple-system, sans-serif";
const FONT_MONO = "'IBM Plex Mono', 'SF Mono', monospace";

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

.theme-dark {
  --bg-base: #0B0D11;
  --bg-panel: #171A21;
  --bg-readout: #0A0C10;
  --hairline: #2A2E37;
  --text-primary: #E8E6DE;
  --text-muted: #8B8F99;
  --brass: #C08A2E;
  --brass-ink: #1A1200;
  --teal: #4FD1C5;
  --danger: #C0524A;
  --teal-soft: rgba(79, 209, 197, 0.08);
  --brass-soft: rgba(192, 138, 46, 0.10);
  --scanline: rgba(255, 255, 255, 0.025);
}
.theme-light {
  --bg-base: #F2F0EA;
  --bg-panel: #FFFFFF;
  --bg-readout: #FAF8F3;
  --hairline: #D9D4C9;
  --text-primary: #26241E;
  --text-muted: #7C7768;
  --brass: #9A6C12;
  --brass-ink: #FFF9EC;
  --teal: #0E7C74;
  --danger: #AF443C;
  --teal-soft: rgba(14, 124, 116, 0.08);
  --brass-soft: rgba(154, 108, 18, 0.10);
  --scanline: rgba(0, 0, 0, 0.02);
}

.chipBtn { transition: border-color 150ms ease, background-color 150ms ease, transform 100ms ease; }
.chipBtn:hover { border-color: var(--teal); }
.chipBtn:active { transform: scale(0.98); }

.consoleInput { background: transparent; border: none; border-bottom: 1px solid var(--hairline);
  color: var(--text-primary); font-family: ${FONT_MONO}; outline: none; width: 100%;
  padding: 8px 2px; font-size: 14px; }
.consoleInput:focus { border-bottom-color: var(--brass); }
.consoleInput::placeholder { color: var(--text-muted); }

.actionBtn { transition: transform 100ms ease, background-color 150ms ease, opacity 150ms ease; }
.actionBtn:active:not(:disabled) { transform: scale(0.96); }
.actionBtn:disabled { opacity: 0.5; cursor: not-allowed; }

.tabBtn { transition: color 150ms ease, border-color 150ms ease; cursor: pointer; background: transparent; border: none;
  display: flex; align-items: center; gap: 6px; padding: 8px 4px; font-family: ${FONT_SANS}; font-weight: 600; font-size: 13px; }

.readoutPanel { position: relative; overflow: hidden; }
.readoutPanel::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background-image: repeating-linear-gradient(to bottom,
    var(--scanline) 0px, var(--scanline) 1px,
    transparent 1px, transparent 3px);
}

.ghostBtn { background: transparent; border: 1px solid var(--hairline); border-radius: 6px;
  color: var(--text-muted); font-family: ${FONT_SANS}; font-size: 11px; padding: 4px 10px;
  cursor: pointer; display: flex; align-items: center; gap: 4px; transition: opacity 150ms ease, border-color 150ms ease, color 150ms ease; }
.ghostBtn:hover { opacity: 0.75; }
.ghostBtn.confirming { border-color: var(--danger); color: var(--danger); opacity: 1; }
.ghostBtn.positive { border-color: var(--teal); color: var(--teal); opacity: 1; }

.iconBtn { background: transparent; border: 1px solid var(--hairline); border-radius: 6px;
  color: var(--text-muted); padding: 5px 8px; cursor: pointer; display: flex; align-items: center; gap: 5px;
  font-family: ${FONT_SANS}; font-size: 11px; transition: border-color 150ms ease, color 150ms ease; }
.iconBtn:hover { border-color: var(--teal); color: var(--text-primary); }
.iconBtn.active { border-color: var(--brass); color: var(--text-primary); }

.historyRow { transition: border-color 150ms ease; cursor: pointer; }
.historyRow:hover { border-color: var(--teal) !important; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .spin { animation: none; } }
`;

const FONT_SIZES = { s: 12.5, m: 13.5, l: 15.5 };

/* ============================================================
   Rich text rendering
   ============================================================ */
const SECTION_EMOJI = {
  '結論': '🎯', '分析': '📊', '主要風險': '⚠️', '風險': '⚠️',
  '反方觀點': '🔄', '建議方向': '🧭', '調整方向': '🧭', '不確定之處': '❓', '資料時間': '🕒',
};
const SECTION_PATTERN = /^(結論|分析|主要風險|風險|反方觀點|建議方向|調整方向|不確定之處|資料時間)\s*[:：]\s*(.*)$/;

function preprocessText(t) {
  let s = (t || '')
    .replace(/```[a-zA-Z]*\n?/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-—*_]{3,}\s*$/gm, '');
  s = s.replace(/\n+\s*([，。、；：）」』%])/g, '$1');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

function renderInline(str, keyBase) {
  const parts = String(str).split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) =>
    i % 2 === 1
      ? <strong key={`${keyBase}-b${i}`} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p}</strong>
      : <React.Fragment key={`${keyBase}-t${i}`}>{p}</React.Fragment>
  );
}

function RichText({ text }) {
  const s = preprocessText(text);
  if (!s) return null;
  const lines = s.split('\n');
  return (
    <div>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
        const m = line.match(SECTION_PATTERN);
        if (m) {
          const emoji = SECTION_EMOJI[m[1]] || '▸';
          return (
            <div key={i} style={{ marginTop: i === 0 ? 0 : 12 }}>
              <span style={{ fontWeight: 700 }}>{emoji} {m[1]}：</span>
              {m[2] ? <span>{renderInline(m[2], i)}</span> : null}
            </div>
          );
        }
        return <div key={i} style={{ marginTop: 2 }}>{renderInline(line, i)}</div>;
      })}
    </div>
  );
}

/* ============================================================
   Persona / task definitions
   ============================================================ */
const STRUCTURE_RULE =
  `- 回答結構：第一行用「結論：」開頭；中段是分析內文；最後兩行分別用「主要風險：」和「反方觀點：」開頭，各一句話。
- 除了上述標籤行之外輸出乾淨的純文字，不要用 #、★、①②③、--- 這類符號。重點詞可以用 **粗體** 標記，但要節制。
- 每一句話寫在同一行，不要在句子中間換行。`;

function basePersonaSystem(todayStr) {
  return `你是使用者的首席投資分析師，性格冷靜、理性、直接。今天是${todayStr}。
規則：
- 用繁體中文回答。
${STRUCTURE_RULE}
- 這是儀表板裡的一個區塊，不是完整報告：控制在約 200 字以內，句子一定要完整收尾，絕不能被截斷。
- 資產配置一律用相對權重表達，不詢問使用者實際金額。
- 若涉及即時行情、利率、新聞或財報數字，你有 web_search 工具，請先查再答，並在內文註明資料時間。
- 只做分析，不建議或執行任何交易操作。`;
}

function advisorPersonaSystem(personName, framework, todayStr) {
  return `你現在要示範「${personName}」會怎麼想這件事——套用他公開資料中展現的心智模型（${framework}），不是模仿語氣的角色扮演，是用他的認知框架來分析。
規則：
- 用繁體中文回答，直接進入他會怎麼想，不用「作為${personName}...」這種開場白。
- 最後一行用「主要風險：」或「不確定之處：」開頭收尾（擇一）。除標籤行外輸出乾淨純文字，不用 #、★、①②③ 符號；重點詞可用 **粗體**，要節制；句子不要在中間換行。
- 今天是${todayStr}。控制在約 200 字以內，句子要完整收尾。
- 誠實邊界：這是根據公開資料蒸餾的思維框架，不是本人真實想法，只反映到蒐集時間點為止的公開言論——若情境是他沒公開討論過的，要表現出適度不確定，別斬釘截鐵。
- 若涉及即時行情或新聞，你有 web_search 工具，可以先查再答。`;
}

const TARGET_LENSES = [
  {
    id: 'stock', label: '個股分析', icon: Search, group: 'data',
    buildSystem: (t) => basePersonaSystem(t) + '\n任務：針對目標，判斷值不值得關注、估值貴不貴、最關鍵的驅動因子。',
    buildUser: (target) => `幫我快速分析「${target}」。`,
  },
  {
    id: 'earnings', label: '財報季', icon: FileText, group: 'data',
    buildSystem: (t) => basePersonaSystem(t) + '\n任務：判斷現在是財報前還是財報後，給出市場預期、關鍵指標、可能的意外來源。',
    buildUser: (target) => `幫我看「${target}」的財報狀況。`,
  },
  {
    id: 'sector', label: '產業觀察', icon: Layers, group: 'data',
    buildSystem: (t) => basePersonaSystem(t) + '\n任務：給出目標所在產業的競爭格局、龍頭是誰、值得留意的趨勢轉折點。',
    buildUser: (target) => `幫我看一下「${target}」所在產業的狀況。`,
  },
  {
    id: 'munger', label: '芒格', icon: Scale, group: 'advisor', avatar: AVATARS.munger,
    buildSystem: (t) => advisorPersonaSystem('查理·芒格', '逆向思考（invert, always invert）、多元思維模型、能力圈', t),
    buildUser: (target) => `用你的心智模型看看：「${target}」。`,
  },
  {
    id: 'taleb', label: '塔勒布', icon: AlertTriangle, group: 'advisor', avatar: AVATARS.taleb,
    buildSystem: (t) => advisorPersonaSystem('納西姆·塔勒布', '反脆弱、尾部風險、非對稱下注、透過否定來認識（via negativa）', t),
    buildUser: (target) => `用你的框架看看：「${target}」哪裡有被低估的尾部風險。`,
  },
  {
    id: 'naval', label: 'Naval', icon: Compass, group: 'advisor', avatar: AVATARS.naval,
    buildSystem: (t) => advisorPersonaSystem('Naval Ravikant', '特定知識、槓桿（資本／人力／可複製性）、長期賽局、複利思維', t),
    buildUser: (target) => `用你的框架看看：「${target}」跟槓桿、特定知識、複利的關係。`,
  },
];
const ADVISOR_LENSES = TARGET_LENSES.filter((l) => l.group === 'advisor');

const MARKET_LENS = {
  id: 'market', label: '今日市場概況', icon: Activity,
  buildSystem: (t) => basePersonaSystem(t) + '\n任務：像交易員的晨會筆記一樣，給 3 個今天最值得注意的重點（大盤、總經、加密貨幣任選相關的），每個重點一行。',
  buildUser: () => '請給我今天的市場概況。',
};

const ALLOCATION_BASE_LENS = {
  id: 'allocation_base', label: '配置健檢', icon: PieChart, group: 'data',
  buildSystem: (t) => basePersonaSystem(t) + '\n任務：用煞車（防守型資產）跟油門（進攻型資產）的邏輯評估這個配置的風險高低。「反方觀點：」那一行改成「調整方向：」，給一個可以考慮的調整方向（是選項，不是指令）。',
  buildUser: (v) => `幫我看看這個配置：「${v}」。`,
};
const ALLOC_LENS_LOOKUP = [ALLOCATION_BASE_LENS, ...ADVISOR_LENSES];

function ideasSystem(todayStr) {
  return `你是使用者的首席投資分析師。今天是${todayStr}。你有 web_search 工具，請先搜尋最新市場狀況再回答。
任務：給 3 個具體的投資靈感（個股、產業或主題都可以）。
輸出格式：只輸出一個 JSON 陣列，不要有任何其他文字、說明或 markdown 圍欄。陣列有 3 個物件，每個物件包含：
"title"（12 字以內的標的或主題名稱）、"thesis"（一句話論點，40 字以內）、"risk"（一句話風險，40 字以內）。
全部使用繁體中文。這是分析靈感，不是交易指令。`;
}

/* ============================================================
   API + storage helpers
   ============================================================ */
function todayString() {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function callClaudeOnce(system, userMsg) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system,
      messages: [{ role: 'user', content: userMsg }],
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    }),
  });
  const data = await res.json();
  if (data && data.type === 'exceeded_limit') {
    throw new Error('RATE::已達目前方案的用量上限或同時查詢過多。');
  }
  if (!res.ok || data.error) {
    const raw = (data && data.error && data.error.message) || '';
    if (res.status === 429 || raw.includes('exceeded_limit') || raw.toLowerCase().includes('rate')) {
      throw new Error('RATE::查詢太頻繁或已達用量上限。');
    }
    throw new Error(raw || `連線失敗（狀態碼 ${res.status}）`);
  }
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n\n').trim();
  if (!text) throw new Error('沒有收到有效的分析內容，請重新嘗試。');
  return text;
}

async function callClaude(system, userMsg) {
  const waits = [4000, 8000];
  for (let attempt = 0; ; attempt++) {
    try {
      return await callClaudeOnce(system, userMsg);
    } catch (err) {
      const msg = (err && err.message) || '';
      if (msg.startsWith('RATE::') && attempt < waits.length) {
        await sleep(waits[attempt]);
        continue;
      }
      throw new Error(msg.replace('RATE::', '') + (msg.startsWith('RATE::') ? '（已自動重試仍失敗，稍等幾分鐘再試）' : ''));
    }
  }
}

function toKeySafe(str) {
  const slug = str.trim().replace(/["'\\/]/g, '').replace(/\s+/g, '_').slice(0, 120);
  return slug || `t${Date.now()}`;
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

async function loadEntry(slug, fallbackTarget) {
  try {
    const res = await window.storage.get(`analyses:${slug}`);
    if (!res || !res.value) return { displayTarget: fallbackTarget, rounds: [] };
    const parsed = JSON.parse(res.value);
    return { displayTarget: parsed.displayTarget || fallbackTarget, rounds: Array.isArray(parsed.rounds) ? parsed.rounds : [] };
  } catch (e) {
    return { displayTarget: fallbackTarget, rounds: [] };
  }
}

async function saveRound(target, lensIds, resultsMap) {
  const okIds = lensIds.filter((id) => resultsMap[id] && resultsMap[id].status === 'done');
  if (okIds.length === 0) return null;
  const slug = toKeySafe(target);
  const entry = await loadEntry(slug, target);
  const newRound = {
    time: new Date().toISOString(),
    lenses: okIds,
    results: Object.fromEntries(okIds.map((id) => [id, resultsMap[id].text || ''])),
  };
  const updatedEntry = { displayTarget: target, rounds: [...entry.rounds, newRound] };
  await window.storage.set(`analyses:${slug}`, JSON.stringify(updatedEntry));

  let index = [];
  try {
    const idxRes = await window.storage.get('analyses_index');
    if (idxRes && idxRes.value) index = JSON.parse(idxRes.value);
  } catch (e) { index = []; }
  const i = index.findIndex((it) => it.slug === slug);
  const summary = { slug, displayTarget: target, lastTime: newRound.time, roundCount: updatedEntry.rounds.length };
  if (i >= 0) index[i] = summary; else index.push(summary);
  await window.storage.set('analyses_index', JSON.stringify(index));
  return summary;
}

async function loadSavedIdeas() {
  try {
    const res = await window.storage.get('saved_ideas');
    return res && res.value ? JSON.parse(res.value) : [];
  } catch (e) { return []; }
}
async function persistSavedIdeas(list) {
  try { await window.storage.set('saved_ideas', JSON.stringify(list)); } catch (e) {}
}

async function loadReferences() {
  try {
    const res = await window.storage.get('references');
    return res && res.value ? JSON.parse(res.value) : [];
  } catch (e) { return []; }
}
async function persistReferences(list) {
  try { await window.storage.set('references', JSON.stringify(list)); } catch (e) {}
}

/* Fixed sector universe — only these appear as top filter chips.
   Free-form stock tags (2330, 台積電) are kept separately for target linking. */
const SECTORS = [
  'AI伺服器', '晶片/半導體', '電力', '散熱/機殼', '光通訊/CPO', '記憶體', '載板/PCB',
  '美股科技', '加密貨幣', 'ETF/大盤', '債券/利率', '總經/政策', '黃金/避險', '國防', '其他',
];

/* Summarize a pasted post into a reference card (transformative use, not full-text copy).
   Returns { summary, points, tags, sectors } as JSON. */
function referenceSummarySystem(todayStr) {
  return `你是使用者的研究助理。今天是${todayStr}。使用者會貼上一篇財經內容（可能來自社群貼文），請把它濃縮成一張「參考卡」——這是轉化性的重點筆記，不是原文複製。
輸出格式：只輸出一個 JSON 物件，不要有其他文字或 markdown 圍欄，包含：
"summary"（用你自己的話寫的 3 到 5 句重點摘要，繁體中文，不要照抄原文句子）、
"points"（陣列，最多 5 個關鍵數據或論點，每個 20 字以內）、
"tags"（陣列，最多 8 個「標的」標籤，只放提到的股票代號與公司名，方便日後比對；例如 "2330"、"台積電"）、
"sectors"（陣列，最多 2 個「賽道」，只能從以下固定清單中挑選，不要自創：${SECTORS.join('、')}）。
不要輸出原文全文。若內容包含明顯的投資建議，照原樣摘要即可，但不要放大或背書。`;
}

async function loadUiSettings() {
  try {
    const res = await window.storage.get('ui_settings');
    return res && res.value ? JSON.parse(res.value) : null;
  } catch (e) { return null; }
}
async function persistUiSettings(settings) {
  try { await window.storage.set('ui_settings', JSON.stringify(settings)); } catch (e) {}
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('copy failed'));
    } catch (e) { reject(e); }
  });
}

/* ============================================================
   Shared sequential multi-lens round runner
   ============================================================ */
function useLensRound() {
  const [round, setRound] = useState(null);
  const roundIdRef = useRef(0);

  async function start(targetText, lensObjs, onSaved) {
    roundIdRef.current += 1;
    const thisRoundId = roundIdRef.current;
    const initial = {};
    lensObjs.forEach((l) => { initial[l.id] = { status: 'loading', text: '' }; });
    setRound({ target: targetText, lensIds: lensObjs.map((l) => l.id), results: initial });

    const accumulator = {};
    for (const lens of lensObjs) {
      if (roundIdRef.current !== thisRoundId) return;
      try {
        const text = await callClaude(lens.buildSystem(todayString()), lens.buildUser(targetText));
        accumulator[lens.id] = { status: 'done', text };
      } catch (err) {
        accumulator[lens.id] = { status: 'error', text: (err && err.message) || '發生未知錯誤。' };
      }
      if (roundIdRef.current === thisRoundId) {
        setRound((prev) => (prev ? { ...prev, results: { ...prev.results, [lens.id]: accumulator[lens.id] } } : prev));
      }
    }

    if (roundIdRef.current === thisRoundId && onSaved) {
      try { await onSaved(targetText, lensObjs.map((l) => l.id), accumulator); } catch (e) {}
    }
  }

  function reset() { setRound(null); }
  const isRunning = !!round && round.lensIds.some((id) => round.results[id].status === 'loading');
  const completedCount = round ? round.lensIds.filter((id) => round.results[id].status !== 'loading').length : 0;
  return { round, start, reset, isRunning, completedCount };
}

/* ============================================================
   Shared UI bits
   ============================================================ */
function ResultBlock({ status, text }) {
  if (status === 'loading') {
    return (
      <span style={{ color: 'var(--brass)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Loader2 size={13} className="spin" /> 查詢中，正在讀取即時資料
      </span>
    );
  }
  if (status === 'error') {
    return <span style={{ color: 'var(--danger)' }}>訊號中斷 — {text}</span>;
  }
  return <RichText text={text} />;
}

function LensCheckbox({ lens, checked, onToggle, tone }) {
  const Icon = lens.icon;
  const color = tone === 'advisor' ? 'var(--brass)' : 'var(--teal)';
  const soft = tone === 'advisor' ? 'var(--brass-soft)' : 'var(--teal-soft)';
  return (
    <button
      className="chipBtn"
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8,
        border: `1px solid ${checked ? color : 'var(--hairline)'}`,
        background: checked ? soft : 'transparent',
        cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)',
      }}
    >
      <span style={{ width: 15, height: 15, borderRadius: 4, border: `1px solid ${checked ? color : 'var(--hairline)'}`, background: checked ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {checked && <Check size={10} color="var(--bg-base)" />}
      </span>
      {lens.avatar ? (
        <img
          src={lens.avatar}
          alt={lens.label}
          style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, objectFit: 'cover', border: `1px solid ${checked ? color : 'var(--hairline)'}` }}
        />
      ) : (
        <Icon size={16} style={{ color }} />
      )}
      <span style={{ fontSize: 13, fontFamily: FONT_SANS }}>{lens.label}</span>
    </button>
  );
}

function ResultsList({ round, lensLookup }) {
  if (!round) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
      {round.lensIds.map((id) => {
        const lens = lensLookup.find((l) => l.id === id);
        if (!lens) return null;
        const r = round.results[id];
        const Icon = lens.icon;
        const iconColor = lens.group === 'advisor' ? 'var(--brass)' : 'var(--teal)';
        return (
          <div key={id} className="readoutPanel" style={{ background: 'var(--bg-readout)', border: '1px solid var(--hairline)', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              {lens.avatar ? (
                <img src={lens.avatar} alt={lens.label} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--brass)' }} />
              ) : (
                <Icon size={15} style={{ color: iconColor }} />
              )}
              <span style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 13 }}>{lens.label}</span>
            </div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 'var(--fs-body)', lineHeight: 1.8 }}>
              <ResultBlock status={r.status} text={r.text} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   Main component
   ============================================================ */
const TABS = [
  { id: 'market', label: '今日概況', icon: Activity },
  { id: 'target', label: '研究目標', icon: Search },
  { id: 'allocation', label: '配置健檢', icon: PieChart },
  { id: 'ideas', label: '投資靈感', icon: Lightbulb },
  { id: 'references', label: '參考來源', icon: BookMarked },
  { id: 'history', label: '歷史紀錄', icon: History },
];

/* Match saved reference cards to a research target by tag/summary overlap. */
function matchReferences(refs, targetText) {
  if (!targetText) return [];
  const q = targetText.trim().toLowerCase();
  if (!q) return [];
  return refs.filter((r) => {
    const tags = (r.tags || []).map((t) => String(t).toLowerCase());
    if (tags.some((t) => t.includes(q) || q.includes(t))) return true;
    const sectors = (r.sectors || []).map((t) => String(t).toLowerCase());
    if (sectors.some((t) => t.includes(q) || q.includes(t))) return true;
    const hay = `${r.title || ''} ${r.summary || ''}`.toLowerCase();
    return hay.includes(q);
  });
}

export default function AnalystDashboard() {
  const [tab, setTab] = useState('market');

  /* ui settings: theme + font size, persisted */
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState('m');
  const settingsLoaded = useRef(false);

  useEffect(() => {
    loadUiSettings().then((s) => {
      if (s) {
        if (s.theme === 'dark' || s.theme === 'light') setTheme(s.theme);
        if (FONT_SIZES[s.fontSize]) setFontSize(s.fontSize);
      }
      settingsLoaded.current = true;
    });
  }, []);
  useEffect(() => {
    if (settingsLoaded.current) persistUiSettings({ theme, fontSize });
  }, [theme, fontSize]);

  /* update instruction copy */
  const [updateCopied, setUpdateCopied] = useState(false);
  function handleCheckUpdate() {
    copyToClipboard(UPDATE_INSTRUCTION)
      .then(() => {
        setUpdateCopied(true);
        setTimeout(() => setUpdateCopied(false), 3000);
      })
      .catch(() => {});
  }

  /* market — single-shot */
  const [marketState, setMarketState] = useState(null);
  async function runMarket() {
    setMarketState({ status: 'loading', text: '' });
    try {
      const text = await callClaude(MARKET_LENS.buildSystem(todayString()), MARKET_LENS.buildUser());
      setMarketState({ status: 'done', text });
    } catch (err) {
      setMarketState({ status: 'error', text: (err && err.message) || '發生未知錯誤。' });
    }
  }

  /* target + multi-select lenses */
  const [target, setTarget] = useState('');
  const [selectedLenses, setSelectedLenses] = useState([]);
  const targetRound = useLensRound();

  function toggleTargetLens(id) {
    setSelectedLenses((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  async function handleStartTarget() {
    const t = target.trim();
    if (!t || selectedLenses.length === 0 || targetRound.isRunning) return;
    const lensObjs = TARGET_LENSES.filter((l) => selectedLenses.includes(l.id));
    await targetRound.start(t, lensObjs, async (tt, ids, acc) => {
      await saveRound(tt, ids, acc);
      if (historyIndex !== null) loadIndex();
    });
  }
  function handleResetTarget() {
    targetRound.reset();
    setTarget('');
    setSelectedLenses([]);
  }

  /* allocation checkup */
  const [allocTarget, setAllocTarget] = useState('');
  const [selectedAllocAdvisors, setSelectedAllocAdvisors] = useState([]);
  const allocRound = useLensRound();

  function toggleAllocAdvisor(id) {
    setSelectedAllocAdvisors((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  async function handleStartAllocation() {
    const t = allocTarget.trim();
    if (!t || allocRound.isRunning) return;
    const advisorObjs = ADVISOR_LENSES.filter((l) => selectedAllocAdvisors.includes(l.id));
    await allocRound.start(t, [ALLOCATION_BASE_LENS, ...advisorObjs]);
  }
  function handleResetAllocation() {
    allocRound.reset();
    setAllocTarget('');
    setSelectedAllocAdvisors([]);
  }

  /* ideas — structured cards + pin/save */
  const [ideasStatus, setIdeasStatus] = useState('idle');
  const [ideasCards, setIdeasCards] = useState([]);
  const [ideasError, setIdeasError] = useState('');
  const [savedIdeas, setSavedIdeas] = useState(null);
  const [confirmingIdeaDelete, setConfirmingIdeaDelete] = useState(null);

  useEffect(() => {
    if (tab === 'ideas' && savedIdeas === null) {
      loadSavedIdeas().then(setSavedIdeas);
    }
  }, [tab]);

  async function runIdeas() {
    setIdeasStatus('loading');
    setIdeasError('');
    try {
      const raw = await callClaude(ideasSystem(todayString()), '給我 3 個投資靈感，照規定格式輸出。');
      const cleaned = raw.replace(/```[a-zA-Z]*\n?/g, '').trim();
      const jsonStart = cleaned.indexOf('[');
      const jsonEnd = cleaned.lastIndexOf(']');
      if (jsonStart === -1 || jsonEnd === -1) throw new Error('回傳格式不正確，請再試一次。');
      const arr = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
      if (!Array.isArray(arr) || arr.length === 0) throw new Error('回傳格式不正確，請再試一次。');
      setIdeasCards(arr.slice(0, 3).map((it) => ({
        title: String(it.title || '').slice(0, 30),
        thesis: String(it.thesis || ''),
        risk: String(it.risk || ''),
      })));
      setIdeasStatus('done');
    } catch (err) {
      setIdeasError((err && err.message) || '發生未知錯誤。');
      setIdeasStatus('error');
    }
  }

  async function pinIdea(idea) {
    const current = savedIdeas || (await loadSavedIdeas());
    if (current.some((s) => s.title === idea.title)) return;
    const next = [{ ...idea, time: new Date().toISOString() }, ...current];
    setSavedIdeas(next);
    await persistSavedIdeas(next);
  }
  async function deleteIdea(title) {
    if (confirmingIdeaDelete !== title) {
      setConfirmingIdeaDelete(title);
      setTimeout(() => setConfirmingIdeaDelete((p) => (p === title ? null : p)), 3000);
      return;
    }
    setConfirmingIdeaDelete(null);
    const next = (savedIdeas || []).filter((s) => s.title !== title);
    setSavedIdeas(next);
    await persistSavedIdeas(next);
  }
  function researchIdea(title) {
    setTarget(title);
    setSelectedLenses(['stock']);
    setTab('target');
  }

  /* references — reference cards from KOL / articles (transformative notes, not full text) */
  const [references, setReferences] = useState(null);
  const [refMode, setRefMode] = useState('manual'); // 'manual' | 'assist'
  const [refForm, setRefForm] = useState({ title: '', source: '', url: '', date: '', summary: '', tags: '', sectors: [] });
  const [refPaste, setRefPaste] = useState('');
  const [refAssistStatus, setRefAssistStatus] = useState('idle'); // idle | loading | error
  const [refAssistError, setRefAssistError] = useState('');
  const [confirmingRefDelete, setConfirmingRefDelete] = useState(null);
  const [showRefForm, setShowRefForm] = useState(false);
  const [expandedRefs, setExpandedRefs] = useState({}); // { id: true }
  const [refSearch, setRefSearch] = useState('');
  const [refTagFilter, setRefTagFilter] = useState(null);

  useEffect(() => {
    if ((tab === 'references' || tab === 'target') && references === null) {
      loadReferences().then(setReferences);
    }
  }, [tab]);

  async function runRefAssist() {
    if (!refPaste.trim()) return;
    setRefAssistStatus('loading');
    setRefAssistError('');
    try {
      const raw = await callClaude(referenceSummarySystem(todayString()), `請把以下內容濃縮成參考卡 JSON：\n\n${refPaste.trim()}`);
      const cleaned = raw.replace(/```[a-zA-Z]*\n?/g, '').trim();
      const s = cleaned.indexOf('{'); const e = cleaned.lastIndexOf('}');
      if (s === -1 || e === -1) throw new Error('回傳格式不正確，請再試一次。');
      const obj = JSON.parse(cleaned.slice(s, e + 1));
      const suggestedSectors = Array.isArray(obj.sectors)
        ? obj.sectors.filter((x) => SECTORS.includes(x)).slice(0, 3)
        : [];
      setRefForm((prev) => ({
        ...prev,
        summary: String(obj.summary || ''),
        tags: Array.isArray(obj.tags) ? obj.tags.join('、') : (prev.tags || ''),
        sectors: suggestedSectors.length ? suggestedSectors : prev.sectors,
        title: prev.title || (Array.isArray(obj.points) && obj.points[0] ? String(obj.points[0]).slice(0, 24) : ''),
      }));
      setRefAssistStatus('idle');
    } catch (err) {
      setRefAssistError((err && err.message) || '發生未知錯誤。');
      setRefAssistStatus('error');
    }
  }

  async function saveReference() {
    if (!refForm.summary.trim() || !refForm.source.trim()) return; // require summary + source
    const current = references || (await loadReferences());
    const card = {
      id: `ref_${Date.now()}`,
      title: refForm.title.trim() || refForm.source.trim(),
      source: refForm.source.trim(),
      url: refForm.url.trim(),
      date: refForm.date.trim(),
      summary: refForm.summary.trim(),
      tags: refForm.tags.split(/[、,，\s]+/).map((s) => s.trim()).filter(Boolean),
      sectors: (refForm.sectors || []).filter((x) => SECTORS.includes(x)),
      time: new Date().toISOString(),
    };
    const next = [card, ...current];
    setReferences(next);
    await persistReferences(next);
    setRefForm({ title: '', source: '', url: '', date: '', summary: '', tags: '', sectors: [] });
    setRefPaste('');
    setRefAssistStatus('idle');
    setShowRefForm(false);
  }

  function toggleRefExpand(id) {
    setExpandedRefs((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function deleteReference(id) {
    if (confirmingRefDelete !== id) {
      setConfirmingRefDelete(id);
      setTimeout(() => setConfirmingRefDelete((p) => (p === id ? null : p)), 3000);
      return;
    }
    setConfirmingRefDelete(null);
    const next = (references || []).filter((r) => r.id !== id);
    setReferences(next);
    await persistReferences(next);
  }

  const linkedReferences = matchReferences(references || [], target);

  const allRefTags = React.useMemo(() => {
    const present = new Set();
    (references || []).forEach((r) => (r.sectors || []).forEach((s) => present.add(s)));
    // preserve the canonical SECTORS order
    return SECTORS.filter((s) => present.has(s));
  }, [references]);

  const filteredReferences = React.useMemo(() => {
    let list = references || [];
    if (refTagFilter) list = list.filter((r) => (r.sectors || []).includes(refTagFilter));
    const q = refSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const hay = `${r.title || ''} ${r.source || ''} ${r.summary || ''} ${(r.tags || []).join(' ')} ${(r.sectors || []).join(' ')}`.toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [references, refSearch, refTagFilter]);

  /* history — two-level accordion */
  const [historyIndex, setHistoryIndex] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedSlug, setExpandedSlug] = useState(null);
  const [expandedData, setExpandedData] = useState({});
  const [expandedLoading, setExpandedLoading] = useState(null);
  const [expandedRounds, setExpandedRounds] = useState({});
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  useEffect(() => {
    if (tab === 'history' && historyIndex === null) loadIndex();
  }, [tab]);

  async function loadIndex() {
    setHistoryLoading(true);
    try {
      const res = await window.storage.get('analyses_index');
      const list = res && res.value ? JSON.parse(res.value) : [];
      list.sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
      setHistoryIndex(list);
    } catch (e) {
      setHistoryIndex([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function toggleExpand(slug, fallbackTarget) {
    if (expandedSlug === slug) { setExpandedSlug(null); return; }
    setExpandedSlug(slug);
    if (!expandedData[slug]) {
      setExpandedLoading(slug);
      const entry = await loadEntry(slug, fallbackTarget);
      setExpandedData((prev) => ({ ...prev, [slug]: entry }));
      setExpandedLoading(null);
    } else {
      loadEntry(slug, fallbackTarget).then((entry) => {
        setExpandedData((prev) => ({ ...prev, [slug]: entry }));
      });
    }
  }

  function toggleRound(slug, idx) {
    const key = `${slug}#${idx}`;
    setExpandedRounds((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleDelete(slug) {
    if (confirmingDelete !== slug) {
      setConfirmingDelete(slug);
      setTimeout(() => setConfirmingDelete((prev) => (prev === slug ? null : prev)), 3000);
      return;
    }
    setConfirmingDelete(null);
    try { await window.storage.delete(`analyses:${slug}`); } catch (e) {}
    const newIndex = (historyIndex || []).filter((it) => it.slug !== slug);
    setHistoryIndex(newIndex);
    try { await window.storage.set('analyses_index', JSON.stringify(newIndex)); } catch (e) {}
    setExpandedData((prev) => { const c = { ...prev }; delete c[slug]; return c; });
    if (expandedSlug === slug) setExpandedSlug(null);
  }

  /* ---------- render ---------- */
  const primaryBtn = {
    background: 'var(--brass)', color: 'var(--brass-ink)', border: 'none', borderRadius: 6,
    padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 6,
    fontFamily: FONT_SANS, fontWeight: 600, fontSize: 13, cursor: 'pointer',
  };

  return (
    <div
      className={theme === 'dark' ? 'theme-dark' : 'theme-light'}
      style={{
        minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)',
        fontFamily: FONT_SANS, padding: '28px 20px', boxSizing: 'border-box',
        '--fs-body': `${FONT_SIZES[fontSize]}px`,
        transition: 'background-color 200ms ease, color 200ms ease',
      }}
    >
      <style>{GLOBAL_CSS}</style>
      <div style={{ maxWidth: 840, margin: '0 auto' }}>

        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 2, color: 'var(--teal)', textTransform: 'uppercase' }}>
              分析儀表板 · {APP_VERSION}
            </div>
            <h1 style={{ fontFamily: FONT_SANS, fontWeight: 700, fontSize: 26, margin: '6px 0 4px', letterSpacing: -0.3 }}>
              蒸餾你的分析師
            </h1>
            <p style={{ fontFamily: FONT_SANS, fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              需在本人登入的 Claude 對話中使用；分享連結無法運作。
            </p>
          </div>

          {/* settings cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button className="iconBtn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="切換深淺色">
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
              {theme === 'dark' ? '淺色' : '深色'}
            </button>
            <div style={{ display: 'flex', gap: 4 }}>
              {[['s', '小'], ['m', '中'], ['l', '大']].map(([key, label]) => (
                <button
                  key={key}
                  className={`iconBtn ${fontSize === key ? 'active' : ''}`}
                  onClick={() => setFontSize(key)}
                  title={`字體：${label}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button className={`iconBtn ${updateCopied ? 'active' : ''}`} onClick={handleCheckUpdate} title="複製更新指令，貼給 Claude 或 Cowork">
              <RefreshCw size={13} />
              {updateCopied ? '已複製，貼給 Cowork' : '檢查更新'}
            </button>
          </div>
        </div>

        {/* tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, borderBottom: '1px solid var(--hairline)', marginBottom: 18 }}>
          {TABS.map((tItem) => {
            const Icon = tItem.icon;
            const active = tab === tItem.id;
            return (
              <button
                key={tItem.id}
                className="tabBtn"
                onClick={() => setTab(tItem.id)}
                style={{
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderBottom: `2px solid ${active ? 'var(--brass)' : 'transparent'}`,
                  marginRight: 8,
                }}
              >
                <Icon size={14} /> {tItem.label}
              </button>
            );
          })}
        </div>

        {/* ============ TAB: 今日概況 ============ */}
        {tab === 'market' && (
          <div>
            <button
              className="actionBtn"
              disabled={marketState && marketState.status === 'loading'}
              onClick={runMarket}
              style={primaryBtn}
            >
              {marketState && marketState.status === 'loading' ? <Loader2 size={14} className="spin" /> : <Play size={14} />}
              {marketState ? '重新查詢' : '查詢今日市場概況'}
            </button>
            {marketState && (
              <div className="readoutPanel" style={{ marginTop: 14, background: 'var(--bg-readout)', border: '1px solid var(--hairline)', borderRadius: 10, padding: 16, fontFamily: FONT_SANS, fontSize: 'var(--fs-body)', lineHeight: 1.8 }}>
                <ResultBlock status={marketState.status} text={marketState.text} />
              </div>
            )}
          </div>
        )}

        {/* ============ TAB: 研究目標 ============ */}
        {tab === 'target' && (
          <div>
            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--hairline)', borderRadius: 10, padding: 16 }}>
              <label style={{ fontSize: 11, letterSpacing: 1, color: 'var(--text-muted)', fontFamily: FONT_MONO }}>研究目標</label>
              <input
                className="consoleInput"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="例如:0050、台積電、Tesla"
                style={{ marginBottom: 14 }}
              />

              <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 1, color: 'var(--teal)', marginBottom: 6 }}>分析角度</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2" style={{ marginBottom: 14 }}>
                {TARGET_LENSES.filter((l) => l.group === 'data').map((lens) => (
                  <LensCheckbox key={lens.id} lens={lens} checked={selectedLenses.includes(lens.id)} onToggle={() => toggleTargetLens(lens.id)} tone="data" />
                ))}
              </div>

              <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 1, color: 'var(--brass)', marginBottom: 6 }}>顧問團</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2" style={{ marginBottom: 6 }}>
                {ADVISOR_LENSES.map((lens) => (
                  <LensCheckbox key={lens.id} lens={lens} checked={selectedLenses.includes(lens.id)} onToggle={() => toggleTargetLens(lens.id)} tone="advisor" />
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 14px' }}>
                顧問視角為公開資料蒸餾的思維框架，不是本人真實想法。鏡頭會依序執行，勾越多等越久。
              </p>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="actionBtn"
                  disabled={!target.trim() || selectedLenses.length === 0 || targetRound.isRunning}
                  onClick={handleStartTarget}
                  style={primaryBtn}
                >
                  {targetRound.isRunning ? (
                    <><Loader2 size={14} className="spin" /> 分析中({targetRound.completedCount}/{targetRound.round.lensIds.length} 完成)</>
                  ) : (
                    <><Play size={14} /> 開始分析</>
                  )}
                </button>
                {targetRound.round && !targetRound.isRunning && (
                  <button className="ghostBtn" onClick={handleResetTarget}><RotateCcw size={11} /> 換一個目標</button>
                )}
              </div>
            </div>

            {target.trim() && linkedReferences.length > 0 && (
              <div style={{ marginTop: 16, background: 'var(--bg-panel)', border: '1px solid var(--hairline)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Link2 size={14} style={{ color: 'var(--teal)' }} />
                  <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: 'var(--teal)' }}>相關參考來源（{linkedReferences.length}）</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {linkedReferences.map((r) => (
                    <div key={r.id} style={{ background: 'var(--bg-readout)', border: '1px solid var(--hairline)', borderRadius: 8, padding: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>📎 {r.title}</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 6px' }}>
                        {r.source}{r.date ? ` · ${r.date}` : ''}
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.7 }}>{r.summary}</div>
                      {r.tags && r.tags.length > 0 && (
                        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {r.tags.map((t, i) => (
                            <span key={i} style={{ fontSize: 11, color: 'var(--text-muted)', border: '1px solid var(--hairline)', borderRadius: 4, padding: '1px 6px' }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {targetRound.round && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: 'var(--text-muted)' }}>
                  目標:<span style={{ color: 'var(--text-primary)' }}>{targetRound.round.target}</span>
                  {!targetRound.isRunning && <span style={{ marginLeft: 8, color: 'var(--teal)' }}>已自動存檔</span>}
                </div>
                <ResultsList round={targetRound.round} lensLookup={TARGET_LENSES} />
              </div>
            )}
          </div>
        )}

        {/* ============ TAB: 配置健檢 ============ */}
        {tab === 'allocation' && (
          <div>
            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--hairline)', borderRadius: 10, padding: 16 }}>
              <label style={{ fontSize: 11, letterSpacing: 1, color: 'var(--text-muted)', fontFamily: FONT_MONO }}>目前配置(自由描述)</label>
              <input
                className="consoleInput"
                value={allocTarget}
                onChange={(e) => setAllocTarget(e.target.value)}
                placeholder="例如:60% 0050、30% 台積電、10% 現金"
                style={{ marginBottom: 14 }}
              />

              <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 1, color: 'var(--brass)', marginBottom: 6 }}>顧問團(可選，疊加意見)</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2" style={{ marginBottom: 6 }}>
                {ADVISOR_LENSES.map((lens) => (
                  <LensCheckbox key={lens.id} lens={lens} checked={selectedAllocAdvisors.includes(lens.id)} onToggle={() => toggleAllocAdvisor(lens.id)} tone="advisor" />
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 14px' }}>
                此分頁目前不會存進歷史紀錄(等真正的本機檔案系統版本再做)。
              </p>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="actionBtn"
                  disabled={!allocTarget.trim() || allocRound.isRunning}
                  onClick={handleStartAllocation}
                  style={primaryBtn}
                >
                  {allocRound.isRunning ? (
                    <><Loader2 size={14} className="spin" /> 健檢中({allocRound.completedCount}/{allocRound.round.lensIds.length} 完成)</>
                  ) : (
                    <><Play size={14} /> 開始健檢</>
                  )}
                </button>
                {allocRound.round && !allocRound.isRunning && (
                  <button className="ghostBtn" onClick={handleResetAllocation}><RotateCcw size={11} /> 換一個配置</button>
                )}
              </div>
            </div>

            {allocRound.round && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: 'var(--text-muted)' }}>
                  配置:<span style={{ color: 'var(--text-primary)' }}>{allocRound.round.target}</span>
                </div>
                <ResultsList round={allocRound.round} lensLookup={ALLOC_LENS_LOOKUP} />
              </div>
            )}
          </div>
        )}

        {/* ============ TAB: 投資靈感 ============ */}
        {tab === 'ideas' && (
          <div>
            <button
              className="actionBtn"
              disabled={ideasStatus === 'loading'}
              onClick={runIdeas}
              style={primaryBtn}
            >
              {ideasStatus === 'loading' ? <Loader2 size={14} className="spin" /> : <Play size={14} />}
              {ideasStatus === 'done' ? '再給我三個' : '給我三個投資靈感'}
            </button>

            {ideasStatus === 'loading' && (
              <div style={{ marginTop: 14, color: 'var(--brass)', fontFamily: FONT_SANS, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Loader2 size={13} className="spin" /> 查詢中，正在讀取即時資料
              </div>
            )}
            {ideasStatus === 'error' && (
              <div style={{ marginTop: 14, color: 'var(--danger)', fontFamily: FONT_SANS, fontSize: 13 }}>訊號中斷 — {ideasError}</div>
            )}

            {ideasStatus === 'done' && ideasCards.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
                {ideasCards.map((idea, i) => {
                  const alreadyPinned = (savedIdeas || []).some((s) => s.title === idea.title);
                  return (
                    <div key={i} className="readoutPanel" style={{ background: 'var(--bg-readout)', border: '1px solid var(--hairline)', borderRadius: 10, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>💡 {idea.title}</div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button
                            className={`ghostBtn ${alreadyPinned ? 'positive' : ''}`}
                            onClick={() => pinIdea(idea)}
                            disabled={alreadyPinned}
                          >
                            <Pin size={11} /> {alreadyPinned ? '已存檔' : '存檔'}
                          </button>
                          <button className="ghostBtn" onClick={() => researchIdea(idea.title)}>
                            <ArrowUpRight size={11} /> 研究這個
                          </button>
                        </div>
                      </div>
                      <div style={{ marginTop: 10, fontSize: 'var(--fs-body)', lineHeight: 1.8 }}>
                        <div><span style={{ fontWeight: 700 }}>🎯 論點:</span>{idea.thesis}</div>
                        <div style={{ marginTop: 6 }}><span style={{ fontWeight: 700 }}>⚠️ 風險:</span>{idea.risk}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {savedIdeas && savedIdeas.length > 0 && (
              <div style={{ marginTop: 26 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 1, color: 'var(--teal)', marginBottom: 8 }}>
                  📌 已存檔的靈感({savedIdeas.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {savedIdeas.map((idea) => (
                    <div key={idea.title} style={{ background: 'var(--bg-panel)', border: '1px solid var(--hairline)', borderRadius: 10, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>💡 {idea.title}</div>
                          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{formatDateTime(idea.time)}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button className="ghostBtn" onClick={() => researchIdea(idea.title)}>
                            <ArrowUpRight size={11} /> 研究這個
                          </button>
                          <button
                            className={`ghostBtn ${confirmingIdeaDelete === idea.title ? 'confirming' : ''}`}
                            onClick={() => deleteIdea(idea.title)}
                          >
                            <Trash2 size={11} /> {confirmingIdeaDelete === idea.title ? '確定刪除?' : '刪除'}
                          </button>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 'var(--fs-body)', lineHeight: 1.75 }}>
                        <div><span style={{ fontWeight: 700 }}>🎯 論點:</span>{idea.thesis}</div>
                        <div style={{ marginTop: 4 }}><span style={{ fontWeight: 700 }}>⚠️ 風險:</span>{idea.risk}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ TAB: 參考來源 ============ */}
        {tab === 'references' && (
          <div>
            {/* toolbar: add button + search */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
              <button
                className="actionBtn"
                onClick={() => setShowRefForm((v) => !v)}
                style={{ ...primaryBtn, padding: '8px 14px' }}
              >
                <Plus size={14} /> {showRefForm ? '收起表單' : '新增參考卡'}
              </button>
              <div style={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-panel)', border: '1px solid var(--hairline)', borderRadius: 8, padding: '6px 10px' }}>
                <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  value={refSearch}
                  onChange={(e) => setRefSearch(e.target.value)}
                  placeholder="搜尋標題、來源、摘要或標籤…"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: FONT_SANS, fontSize: 13 }}
                />
                {refSearch && (
                  <button onClick={() => setRefSearch('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>×</button>
                )}
              </div>
            </div>

            {/* tag filter chips */}
            {allRefTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                <button
                  className="chipBtn"
                  onClick={() => setRefTagFilter(null)}
                  style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                    border: `1px solid ${refTagFilter === null ? 'var(--teal)' : 'var(--hairline)'}`,
                    background: refTagFilter === null ? 'var(--teal-soft)' : 'transparent',
                    color: refTagFilter === null ? 'var(--teal)' : 'var(--text-muted)', fontFamily: FONT_SANS,
                  }}
                >
                  全部
                </button>
                {allRefTags.map((t) => (
                  <button
                    key={t}
                    className="chipBtn"
                    onClick={() => setRefTagFilter(refTagFilter === t ? null : t)}
                    style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                      border: `1px solid ${refTagFilter === t ? 'var(--teal)' : 'var(--hairline)'}`,
                      background: refTagFilter === t ? 'var(--teal-soft)' : 'transparent',
                      color: refTagFilter === t ? 'var(--teal)' : 'var(--text-muted)', fontFamily: FONT_SANS,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            {/* collapsible add form */}
            {showRefForm && (
              <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--hairline)', borderRadius: 10, padding: 16, marginBottom: 18 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                  <button className={`iconBtn ${refMode === 'manual' ? 'active' : ''}`} onClick={() => setRefMode('manual')}>
                    <Plus size={13} /> 自己寫
                  </button>
                  <button className={`iconBtn ${refMode === 'assist' ? 'active' : ''}`} onClick={() => setRefMode('assist')}>
                    <Sparkles size={13} /> Claude 幫我濃縮
                  </button>
                </div>

                {refMode === 'assist' && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, letterSpacing: 1, color: 'var(--text-muted)', fontFamily: FONT_MONO }}>貼上原文（Claude 會濃縮成摘要，不存全文）</label>
                    <textarea
                      value={refPaste}
                      onChange={(e) => setRefPaste(e.target.value)}
                      placeholder="把貼文或文章內容貼在這裡…"
                      style={{
                        width: '100%', minHeight: 90, marginTop: 6, background: 'var(--bg-readout)',
                        border: '1px solid var(--hairline)', borderRadius: 8, color: 'var(--text-primary)',
                        fontFamily: FONT_SANS, fontSize: 13, padding: 10, boxSizing: 'border-box', resize: 'vertical',
                      }}
                    />
                    <button
                      className="actionBtn"
                      disabled={!refPaste.trim() || refAssistStatus === 'loading'}
                      onClick={runRefAssist}
                      style={{ ...primaryBtn, marginTop: 8, padding: '8px 14px' }}
                    >
                      {refAssistStatus === 'loading' ? <><Loader2 size={13} className="spin" /> 濃縮中</> : <><Sparkles size={13} /> 濃縮成摘要</>}
                    </button>
                    {refAssistStatus === 'error' && (
                      <div style={{ marginTop: 6, color: 'var(--danger)', fontSize: 12 }}>訊號中斷 — {refAssistError}</div>
                    )}
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '8px 0 0' }}>
                      濃縮後會自動填入下方摘要與標籤，你可以再編輯，確認後儲存。
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2" style={{ marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: FONT_MONO }}>來源（帳號／作者）*</label>
                    <input className="consoleInput" value={refForm.source} onChange={(e) => setRefForm({ ...refForm, source: e.target.value })} placeholder="例如：IG @xxx.finance" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: FONT_MONO }}>標題（可選）</label>
                    <input className="consoleInput" value={refForm.title} onChange={(e) => setRefForm({ ...refForm, title: e.target.value })} placeholder="這篇在講什麼" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: FONT_MONO }}>連結（可選）</label>
                    <input className="consoleInput" value={refForm.url} onChange={(e) => setRefForm({ ...refForm, url: e.target.value })} placeholder="貼文網址" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: FONT_MONO }}>日期（可選）</label>
                    <input className="consoleInput" value={refForm.date} onChange={(e) => setRefForm({ ...refForm, date: e.target.value })} placeholder="2026/07" />
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: FONT_MONO }}>重點摘要 *（你的話，非原文）</label>
                  <textarea
                    value={refForm.summary}
                    onChange={(e) => setRefForm({ ...refForm, summary: e.target.value })}
                    placeholder="3-5 句重點…"
                    style={{
                      width: '100%', minHeight: 70, marginTop: 4, background: 'var(--bg-readout)',
                      border: '1px solid var(--hairline)', borderRadius: 8, color: 'var(--text-primary)',
                      fontFamily: FONT_SANS, fontSize: 13, padding: 10, boxSizing: 'border-box', resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: FONT_MONO }}>賽道（顯示在頂部篩選；Claude 濃縮會自動建議，可再改）</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {SECTORS.map((s) => {
                      const on = (refForm.sectors || []).includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRefForm((prev) => {
                            const cur = prev.sectors || [];
                            return { ...prev, sectors: on ? cur.filter((x) => x !== s) : [...cur, s] };
                          })}
                          style={{
                            fontSize: 11, padding: '4px 10px', borderRadius: 20, cursor: 'pointer', fontFamily: FONT_SANS,
                            border: `1px solid ${on ? 'var(--brass)' : 'var(--hairline)'}`,
                            background: on ? 'var(--brass-soft)' : 'transparent',
                            color: on ? 'var(--brass)' : 'var(--text-muted)',
                          }}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: FONT_MONO }}>標的（股票代號／公司，用頓號分隔；供研究目標連動，不上頂部）</label>
                  <input className="consoleInput" value={refForm.tags} onChange={(e) => setRefForm({ ...refForm, tags: e.target.value })} placeholder="例如：2330、台積電" />
                </div>

                <button
                  className="actionBtn"
                  disabled={!refForm.summary.trim() || !refForm.source.trim()}
                  onClick={saveReference}
                  style={primaryBtn}
                >
                  <BookMarked size={14} /> 儲存參考卡
                </button>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '10px 0 0' }}>
                  僅存你消化後的重點與出處，供本人研究使用；請勿存入他人原文全文。標籤填得好，研究目標才帶得出來。
                </p>
              </div>
            )}

            {/* count line */}
            {references && references.length > 0 && (
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                {filteredReferences.length === references.length
                  ? `共 ${references.length} 張參考卡`
                  : `符合條件 ${filteredReferences.length} / ${references.length} 張`}
              </div>
            )}

            {/* collapsed title-only cards */}
            {references && references.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredReferences.map((r) => {
                  const open = !!expandedRefs[r.id];
                  return (
                    <div key={r.id} style={{ background: 'var(--bg-panel)', border: '1px solid var(--hairline)', borderRadius: 10, overflow: 'hidden' }}>
                      {/* title row */}
                      <div
                        className="historyRow"
                        onClick={() => toggleRefExpand(r.id)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', gap: 8 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 150ms ease' }} />
                          <span style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📎 {r.title}</span>
                          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                            {r.source}{r.date ? ` · ${r.date}` : ''}
                          </span>
                        </div>
                        <button
                          className={`ghostBtn ${confirmingRefDelete === r.id ? 'confirming' : ''}`}
                          onClick={(e) => { e.stopPropagation(); deleteReference(r.id); }}
                          style={{ flexShrink: 0 }}
                        >
                          <Trash2 size={11} /> {confirmingRefDelete === r.id ? '確定刪除？' : '刪除'}
                        </button>
                      </div>
                      {/* expanded body */}
                      {open && (
                        <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--hairline)' }}>
                          {r.url && (
                            <div style={{ marginTop: 10 }}>
                              <a href={r.url} target="_blank" rel="noreferrer" style={{ color: 'var(--teal)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Link2 size={12} /> 原文連結
                              </a>
                            </div>
                          )}
                          <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.8 }}>{r.summary}</div>
                          {r.sectors && r.sectors.length > 0 && (
                            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {r.sectors.map((s, i) => (
                                <button
                                  key={i}
                                  onClick={() => { setRefTagFilter(s); }}
                                  style={{ fontSize: 11, color: 'var(--brass)', border: '1px solid var(--brass)', background: 'var(--brass-soft)', borderRadius: 20, padding: '2px 10px', cursor: 'pointer' }}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                          {r.tags && r.tags.length > 0 && (
                            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {r.tags.map((t, i) => (
                                <span key={i} style={{ fontSize: 11, color: 'var(--text-muted)', border: '1px solid var(--hairline)', borderRadius: 4, padding: '1px 6px' }}>{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredReferences.length === 0 && (
                  <div style={{ color: 'var(--text-muted)', fontFamily: FONT_MONO, fontSize: 13, padding: '12px 2px' }}>
                    沒有符合條件的參考卡——換個關鍵字或清除篩選。
                  </div>
                )}
              </div>
            )}
            {references && references.length === 0 && (
              <div style={{ marginTop: 8, color: 'var(--text-muted)', fontFamily: FONT_MONO, fontSize: 13 }}>
                還沒有參考卡——按「新增參考卡」建立第一張。
              </div>
            )}
          </div>
        )}

        {/* ============ TAB: 歷史紀錄 ============ */}
        {tab === 'history' && (
          <div>
            {historyLoading && (
              <div style={{ color: 'var(--text-muted)', fontFamily: FONT_MONO, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Loader2 size={14} className="spin" /> 讀取紀錄中
              </div>
            )}
            {!historyLoading && historyIndex && historyIndex.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontFamily: FONT_MONO, fontSize: 13 }}>
                還沒有任何存檔——去「研究目標」分頁做一次研究，這裡就會出現。
              </div>
            )}
            {!historyLoading && historyIndex && historyIndex.map((item) => {
              const isOpen = expandedSlug === item.slug;
              const entry = expandedData[item.slug];
              return (
                <div key={item.slug} style={{ marginBottom: 10 }}>
                  <div
                    className="historyRow"
                    onClick={() => toggleExpand(item.slug, item.displayTarget)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: 'var(--bg-panel)', border: '1px solid var(--hairline)', borderRadius: 10, padding: '12px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 150ms ease' }} />
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{item.displayTarget}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: FONT_MONO }}>
                        {item.roundCount} 次分析 · 最近 {formatDateTime(item.lastTime)}
                      </span>
                    </div>
                    <button
                      className={`ghostBtn ${confirmingDelete === item.slug ? 'confirming' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.slug); }}
                    >
                      <Trash2 size={11} /> {confirmingDelete === item.slug ? '確定刪除?' : '刪除'}
                    </button>
                  </div>

                  {isOpen && (
                    <div style={{ marginTop: 6, paddingLeft: 8, borderLeft: '2px solid var(--hairline)' }}>
                      {expandedLoading === item.slug && (
                        <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '8px 12px' }}>讀取中…</div>
                      )}
                      {entry && entry.rounds.length === 0 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '8px 12px' }}>沒有紀錄。</div>
                      )}
                      {entry && entry.rounds.map((rnd, origIdx) => ({ rnd, origIdx }))
                        .slice().reverse()
                        .map(({ rnd, origIdx }) => {
                          const rKey = `${item.slug}#${origIdx}`;
                          const rOpen = !!expandedRounds[rKey];
                          return (
                            <div key={rKey} style={{ margin: '6px 0 6px 12px' }}>
                              <div
                                className="historyRow"
                                onClick={() => toggleRound(item.slug, origIdx)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  background: 'var(--bg-readout)', border: '1px solid var(--hairline)', borderRadius: 8, padding: '10px 12px',
                                }}
                              >
                                <ChevronDown size={12} style={{ color: 'var(--text-muted)', transform: rOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 150ms ease' }} />
                                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: 'var(--text-primary)' }}>{formatDateTime(rnd.time)}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  {rnd.lenses.map((id) => {
                                    const lens = TARGET_LENSES.find((l) => l.id === id);
                                    if (!lens) return null;
                                    const Icon = lens.icon;
                                    return <Icon key={id} size={12} style={{ color: lens.group === 'advisor' ? 'var(--brass)' : 'var(--teal)' }} />;
                                  })}
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: FONT_MONO }}>{rnd.lenses.length} 個鏡頭</span>
                              </div>

                              {rOpen && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6, marginLeft: 8 }}>
                                  {rnd.lenses.map((id) => {
                                    const lens = TARGET_LENSES.find((l) => l.id === id);
                                    if (!lens) return null;
                                    const Icon = lens.icon;
                                    const iconColor = lens.group === 'advisor' ? 'var(--brass)' : 'var(--teal)';
                                    return (
                                      <div key={id} style={{ padding: 12, background: 'var(--bg-panel)', borderRadius: 6 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                          <Icon size={13} style={{ color: iconColor }} />
                                          <span style={{ fontSize: 12, fontWeight: 600 }}>{lens.label}</span>
                                        </div>
                                        <div style={{ fontFamily: FONT_SANS, fontSize: 'var(--fs-body)', lineHeight: 1.75, color: 'var(--text-primary)' }}>
                                          <RichText text={rnd.results[id]} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
