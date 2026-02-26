// Domain Expiry Web UI - Main Application Logic

let refreshTimer = null;
let countdownTimer = null;
let nextRefreshTime = null;

// ===== THEME MANAGEMENT =====

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'system';
  applyTheme(savedTheme);
  updateThemeButtons(savedTheme);
}

function setTheme(theme) {
  localStorage.setItem('theme', theme);
  applyTheme(theme);
  updateThemeButtons(theme);
}

function applyTheme(theme) {
  if (theme === 'system') {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

function updateThemeButtons(theme) {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  const currentTheme = localStorage.getItem('theme') || 'system';
  if (currentTheme === 'system') {
    applyTheme('system');
  }
});


// ===== DATE FORMAT MANAGEMENT =====

// Returns the active date format preference ('auto', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD')
function getDateFormat() {
  return localStorage.getItem('dateFormat') || 'auto';
}

// Save preference and re-render the table
function setDateFormat(format) {
  localStorage.setItem('dateFormat', format);
  updateFormatButtons(format);
  fetchDomainData();
}

// Highlight the active format button in the settings panel
function updateFormatButtons(format) {
  document.querySelectorAll('.format-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.format === format);
  });
}

// Format an ISO date string per the current preference.
// Falls back to 'N/A' if the value is null/undefined/unparseable.
function formatDate(isoString) {
  if (!isoString) return 'N/A';

  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'N/A';

  const format = getDateFormat();

  if (format === 'auto') {
    // Use browser locale — force UTC so date matches the API value, not local time
    return new Intl.DateTimeFormat(navigator.language, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC'
    }).format(date);
  }

  // Manual formats — extract UTC date parts to avoid timezone-shift surprises
  const year  = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day   = String(date.getUTCDate()).padStart(2, '0');

  switch (format) {
    case 'DD/MM/YYYY': return `${day}/${month}/${year}`;
    case 'DD-MM-YYYY': return `${day}-${month}-${year}`;
    case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
    case 'MM-DD-YYYY': return `${month}-${day}-${year}`;
    case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
    default:           return `${month}/${day}/${year}`;
  }
}

// Toggle the settings panel open/closed
function toggleSettings() {
  const panel = document.getElementById('settingsPanel');
  const isOpen = panel.classList.toggle('open');
  document.getElementById('settingsBtn').classList.toggle('active', isOpen);

  // Close when clicking outside
  if (isOpen) {
    setTimeout(() => {
      document.addEventListener('click', closeSettingsOnOutsideClick);
    }, 0);
  }
}

function closeSettingsOnOutsideClick(e) {
  const panel = document.getElementById('settingsPanel');
  const btn   = document.getElementById('settingsBtn');
  if (!panel.contains(e.target) && !btn.contains(e.target)) {
    panel.classList.remove('open');
    btn.classList.remove('active');
    document.removeEventListener('click', closeSettingsOnOutsideClick);
  }
}


// ===== COUNTDOWN TIMER =====

function startCountdown() {
  if (countdownTimer) clearInterval(countdownTimer);

  nextRefreshTime = Date.now() + CONFIG.refreshInterval;

  countdownTimer = setInterval(() => {
    const remaining = nextRefreshTime - Date.now();

    if (remaining <= 0) {
      document.getElementById('countdown').textContent = 'Refreshing...';
      return;
    }

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    document.getElementById('countdown').textContent = `${minutes}m ${seconds}s`;
  }, 1000);
}

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}


// ===== DATA FETCHING =====

document.addEventListener('DOMContentLoaded', () => {
  console.log('Domain Expiry Web UI loaded');
  initTheme();
  initSettings();
  fetchDomainData();
  startAutoRefresh();
});

// Initialize settings panel state
function initSettings() {
  const format = getDateFormat();
  updateFormatButtons(format);
}

async function fetchDomainData() {
  const statusElement  = document.getElementById('status');
  const tableBody      = document.getElementById('domainTableBody');
  const updatedElement = document.getElementById('lastUpdated');

  try {
    statusElement.textContent = 'Loading...';
    statusElement.className = 'status loading';

    const response = await fetch(`${CONFIG.apiUrl}/status`);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    tableBody.innerHTML = '';

    if (data.domains && data.domains.length > 0) {
      data.domains.forEach(domain => {
        tableBody.appendChild(createDomainRow(domain));
      });
      statusElement.textContent = `Monitoring ${data.domains.length} domain(s)`;
      statusElement.className = 'status success';
    } else {
      statusElement.textContent = 'No domains found';
      statusElement.className = 'status warning';
    }

    if (data.updated) {
      const updateTime = new Date(data.updated);
      updatedElement.textContent = `Last updated: ${updateTime.toLocaleString()}`;
    }

    startCountdown();

  } catch (error) {
    console.error('Error fetching domain data:', error);
    statusElement.textContent = `Error: ${error.message}`;
    statusElement.className = 'status error';

    tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 20px;">
          <strong>Unable to connect to API</strong><br>
          <small>Check that the API is running at ${CONFIG.apiUrl}</small>
        </td>
      </tr>
    `;
  }
}


// ===== TABLE RENDERING =====

function createDomainRow(domain) {
  const row = document.createElement('tr');

  let statusClass = 'status-green';
  let statusIcon  = '🟢';

  if (domain.days_left !== null && domain.days_left !== undefined) {
    if (domain.days_left <= CONFIG.thresholds.red) {
      statusClass = 'status-red';
      statusIcon  = '🔴';
    } else if (domain.days_left <= CONFIG.thresholds.yellow) {
      statusClass = 'status-yellow';
      statusIcon  = '🟡';
    }
  } else {
    statusClass = 'status-unknown';
    statusIcon  = '⚪';
  }

  row.className = statusClass;

  // Domain name
  const domainCell = document.createElement('td');
  domainCell.textContent = domain.domain;
  row.appendChild(domainCell);

  // Expiration date — use ISO expires field, formatted per user preference
  const expiryCell = document.createElement('td');
  expiryCell.textContent = formatDate(domain.expires);
  row.appendChild(expiryCell);

  // Days remaining
  const daysCell = document.createElement('td');
  if (domain.days_left !== null && domain.days_left !== undefined) {
    daysCell.textContent = `${domain.days_left} days`;
  } else {
    daysCell.textContent = 'N/A';
    if (domain.error) daysCell.title = `Error: ${domain.error}`;
  }
  row.appendChild(daysCell);

  // Status icon
  const statusCell = document.createElement('td');
  statusCell.innerHTML = `<span class="status-icon">${statusIcon}</span>`;
  statusCell.className = 'status-cell';
  row.appendChild(statusCell);

  return row;
}


// ===== REFRESH MANAGEMENT =====

function startAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);

  refreshTimer = setInterval(() => {
    console.log('Auto-refreshing domain data...');
    fetchDomainData();
  }, CONFIG.refreshInterval);

  console.log(`Auto-refresh enabled: every ${CONFIG.refreshInterval / 1000} seconds`);
}

function manualRefresh() {
  console.log('Manual refresh triggered');
  stopCountdown();
  fetchDomainData();
}
