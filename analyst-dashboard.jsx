import React, { useState, useEffect, useRef } from 'react';
import {
  Activity, Search, FileText, Layers, Lightbulb, PieChart,
  Scale, AlertTriangle, Compass,
  Loader2, History, Trash2, ChevronDown, Play, RotateCcw, Check, Pin, ArrowUpRight,
  Sun, Moon, RefreshCw,
} from 'lucide-react';

/* ============================================================
   Version — bump this on every push to GitHub
   ============================================================ */
const APP_VERSION = 'v6.0';
const APP_DATE = '2026-07-13';
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
    id: 'munger', label: '芒格', icon: Scale, group: 'advisor',
    buildSystem: (t) => advisorPersonaSystem('查理·芒格', '逆向思考（invert, always invert）、多元思維模型、能力圈', t),
    buildUser: (target) => `用你的心智模型看看：「${target}」。`,
  },
  {
    id: 'taleb', label: '塔勒布', icon: AlertTriangle, group: 'advisor',
    buildSystem: (t) => advisorPersonaSystem('納西姆·塔勒布', '反脆弱、尾部風險、非對稱下注、透過否定來認識（via negativa）', t),
    buildUser: (target) => `用你的框架看看：「${target}」哪裡有被低估的尾部風險。`,
  },
  {
    id: 'naval', label: 'Naval', icon: Compass, group: 'advisor',
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
      <Icon size={16} style={{ color }} />
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Icon size={15} style={{ color: iconColor }} />
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
  { id: 'history', label: '歷史紀錄', icon: History },
];

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
              首席分析師
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
