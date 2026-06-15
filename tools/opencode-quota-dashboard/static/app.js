/**
 * OpenCode Quota Dashboard - Frontend
 */

let useMock = false;
let autoRefreshTimer = null;
const REFRESH_INTERVAL_MS = 5000;

const els = {
  cards: document.getElementById('cards'),
  sourceBadge: document.getElementById('source-badge'),
  updatedAt: document.getElementById('updated-at'),
  totalWindows: document.getElementById('total-windows'),
  dangerCount: document.getElementById('danger-count'),
  avgRemaining: document.getElementById('avg-remaining'),
  mascotSprite: document.getElementById('mascot-sprite'),
  mascotMsg: document.getElementById('mascot-msg'),
  refreshBtn: document.getElementById('refresh-btn'),
  mockBtn: document.getElementById('mock-btn'),
  autoRefreshCheck: document.getElementById('auto-refresh'),
  setupNote: document.getElementById('setup-note'),
};

async function fetchQuota() {
  const url = useMock ? '/api/quota?mock=1' : '/api/quota';
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function getStatus(percentUsed) {
  if (percentUsed >= 90) return 'danger';
  if (percentUsed >= 60) return 'warning';
  return 'ok';
}

function formatTime(iso) {
  if (!iso) return '--:--:--';
  const d = new Date(iso);
  return d.toLocaleTimeString('zh-Hant', { hour12: false });
}

function renderCards(entries) {
  els.cards.innerHTML = '';

  if (!entries || entries.length === 0) {
    els.cards.innerHTML = '<p class="muted">暫無額度資料。</p>';
    return;
  }

  for (const entry of entries) {
    const status = entry.status || getStatus(entry.percentUsed);
    const card = document.createElement('div');
    card.className = `card ${status}`;

    const fillClass = `progress-fill ${status}`;
    const percentRemaining = entry.percentRemaining ?? Math.max(0, 100 - entry.percentUsed);

    card.innerHTML = `
      <div class="card-header">
        <span class="provider-name">${escapeHtml(entry.provider)}</span>
        <span class="window-tag">${escapeHtml(entry.window || 'N/A')}</span>
      </div>
      <div class="progress-labels">
        <span>已用 ${entry.percentUsed}%</span>
        <span>剩餘 ${percentRemaining}%</span>
      </div>
      <div class="progress-track">
        <div class="${fillClass}" style="width: ${entry.percentUsed}%"></div>
      </div>
      <div class="card-footer">
        <span>${escapeHtml(entry.used || '-')} / ${escapeHtml(entry.limit || '-')}</span>
        <span>重置：${escapeHtml(entry.resetIn || '-')}</span>
      </div>
    `;
    els.cards.appendChild(card);
  }
}

function updateMascot(entries) {
  els.mascotSprite.className = 'sprite';

  if (!entries || entries.length === 0) {
    els.mascotMsg.textContent = '額度健康狀態：沒有資料';
    return;
  }

  const danger = entries.filter((e) => (e.percentUsed || 0) >= 90).length;
  const warning = entries.filter((e) => (e.percentUsed || 0) >= 60 && (e.percentUsed || 0) < 90).length;

  if (danger > 0) {
    els.mascotSprite.classList.add('danger');
    els.mascotMsg.textContent = `警告！有 ${danger} 個額度窗口即將用完！`;
  } else if (warning > 0) {
    els.mascotSprite.classList.add('worried');
    els.mascotMsg.textContent = `注意：${warning} 個窗口已用超過六成。`;
  } else {
    els.mascotSprite.classList.add('happy');
    els.mascotMsg.textContent = '額度充足，繼續火力全開！';
  }
}

function updateSummary(entries) {
  if (!entries || entries.length === 0) {
    els.totalWindows.textContent = '-';
    els.dangerCount.textContent = '-';
    els.avgRemaining.textContent = '-';
    return;
  }

  const danger = entries.filter((e) => (e.percentUsed || 0) >= 90).length;
  const avgRemaining = Math.round(
    entries.reduce((sum, e) => sum + (e.percentRemaining ?? Math.max(0, 100 - (e.percentUsed || 0))), 0) / entries.length
  );

  els.totalWindows.textContent = entries.length;
  els.dangerCount.textContent = danger;
  els.avgRemaining.textContent = `${avgRemaining}%`;
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function refresh() {
  els.refreshBtn.disabled = true;
  els.refreshBtn.textContent = '↻ 更新中…';

  try {
    const data = await fetchQuota();
    renderCards(data.entries);
    updateMascot(data.entries);
    updateSummary(data.entries);

    els.updatedAt.textContent = formatTime(data.updatedAt);
    els.sourceBadge.textContent = data.source === 'cli' ? '即時資料' : 'Demo 資料';
    els.sourceBadge.className = `badge ${data.source === 'cli' ? '' : 'secondary'}`;

    // Show setup note only when we are using mock/fallback
    const isReal = data.source === 'cli';
    els.setupNote.classList.toggle('hidden', isReal);
  } catch (err) {
    els.mascotMsg.textContent = `讀取失敗：${err.message}`;
    els.mascotSprite.classList.add('worried');
  } finally {
    els.refreshBtn.disabled = false;
    els.refreshBtn.textContent = '↻ 立即更新';
  }
}

function setupAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  if (els.autoRefreshCheck.checked) {
    autoRefreshTimer = setInterval(refresh, REFRESH_INTERVAL_MS);
  }
}

els.refreshBtn.addEventListener('click', refresh);

els.mockBtn.addEventListener('click', () => {
  useMock = !useMock;
  els.mockBtn.textContent = useMock ? '🎭 使用真實資料' : '🎭 切換 Demo 資料';
  refresh();
});

els.autoRefreshCheck.addEventListener('change', setupAutoRefresh);

// Initial load
refresh();
setupAutoRefresh();
