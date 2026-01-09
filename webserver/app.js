// Domain Expiry Web UI - Main Application Logic

let refreshTimer = null;
let countdownTimer = null;
let nextRefreshTime = null;

// ===== THEME MANAGEMENT =====

// Initialize theme on page load
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'system';
  applyTheme(savedTheme);
  updateThemeButtons(savedTheme);
}

// Set theme (called by UI buttons)
function setTheme(theme) {
  localStorage.setItem('theme', theme);
  applyTheme(theme);
  updateThemeButtons(theme);
}

// Apply theme to document
function applyTheme(theme) {
  if (theme === 'system') {
    // Use system preference
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// Update active button
function updateThemeButtons(theme) {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

// Listen for system theme changes when in system mode
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  const currentTheme = localStorage.getItem('theme') || 'system';
  if (currentTheme === 'system') {
    applyTheme('system');
  }
});


// ===== COUNTDOWN TIMER =====

// Start countdown timer
function startCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  
  nextRefreshTime = Date.now() + CONFIG.refreshInterval;
  
  countdownTimer = setInterval(() => {
    const remaining = nextRefreshTime - Date.now();
    
    if (remaining <= 0) {
      document.getElementById('countdown').textContent = 'Refreshing...';
      return;
    }
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    document.getElementById('countdown').textContent = 
      `${minutes}m ${seconds}s`;
  }, 1000);
}

// Stop countdown timer
function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}


// ===== DATA FETCHING =====

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('Domain Expiry Web UI loaded');
  initTheme();
  fetchDomainData();
  startAutoRefresh();
});

// Fetch domain data from API
async function fetchDomainData() {
  const statusElement = document.getElementById('status');
  const tableBody = document.getElementById('domainTableBody');
  const updatedElement = document.getElementById('lastUpdated');
  
  try {
    statusElement.textContent = 'Loading...';
    statusElement.className = 'status loading';
    
    const response = await fetch(`${CONFIG.apiUrl}/status`);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Clear existing table rows
    tableBody.innerHTML = '';
    
    // Populate table with domain data
    if (data.domains && data.domains.length > 0) {
      data.domains.forEach(domain => {
        const row = createDomainRow(domain);
        tableBody.appendChild(row);
      });
      
      statusElement.textContent = `Monitoring ${data.domains.length} domain(s)`;
      statusElement.className = 'status success';
    } else {
      statusElement.textContent = 'No domains found';
      statusElement.className = 'status warning';
    }
    
    // Update last refresh timestamp
    if (data.updated) {
      const updateTime = new Date(data.updated);
      updatedElement.textContent = `Last updated: ${updateTime.toLocaleString()}`;
    }
    
    // Restart countdown after successful fetch
    startCountdown();
    
  } catch (error) {
    console.error('Error fetching domain data:', error);
    statusElement.textContent = `Error: ${error.message}`;
    statusElement.className = 'status error';
    
    // Show error in table
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


// Create a table row for a domain
function createDomainRow(domain) {
  const row = document.createElement('tr');
  
  // Determine status color based on days_left
  let statusClass = 'status-green';
  let statusIcon = '🟢';
  
  if (domain.days_left !== null && domain.days_left !== undefined) {
    if (domain.days_left <= CONFIG.thresholds.red) {
      statusClass = 'status-red';
      statusIcon = '🔴';
    } else if (domain.days_left <= CONFIG.thresholds.yellow) {
      statusClass = 'status-yellow';
      statusIcon = '🟡';
    }
  } else {
    statusClass = 'status-unknown';
    statusIcon = '⚪';
  }
  
  row.className = statusClass;
  
  // Domain name column
  const domainCell = document.createElement('td');
  domainCell.textContent = domain.domain;
  row.appendChild(domainCell);
  
  // Expiration date column
  const expiryCell = document.createElement('td');
  expiryCell.textContent = domain.expires_us || 'N/A';
  row.appendChild(expiryCell);
  
  // Days remaining column
  const daysCell = document.createElement('td');
  if (domain.days_left !== null && domain.days_left !== undefined) {
    daysCell.textContent = `${domain.days_left} days`;
  } else {
    daysCell.textContent = 'N/A';
    if (domain.error) {
      daysCell.title = `Error: ${domain.error}`;
    }
  }
  row.appendChild(daysCell);
  
  // Status column
  const statusCell = document.createElement('td');
  statusCell.innerHTML = `<span class="status-icon">${statusIcon}</span>`;
  statusCell.className = 'status-cell';
  row.appendChild(statusCell);
  
  return row;
}

// ===== REFRESH MANAGEMENT =====

// Start automatic refresh timer
function startAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
  
  refreshTimer = setInterval(() => {
    console.log('Auto-refreshing domain data...');
    fetchDomainData();
  }, CONFIG.refreshInterval);
  
  console.log(`Auto-refresh enabled: every ${CONFIG.refreshInterval / 1000} seconds`);
}

// Manual refresh button handler
function manualRefresh() {
  console.log('Manual refresh triggered');
  stopCountdown();
  fetchDomainData();
}
