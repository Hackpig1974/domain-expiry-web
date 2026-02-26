# 🌐 Domain Expiration Monitor - Web UI

A beautiful standalone web dashboard for monitoring domain renewals. This project extends the [Domain Expiry API](https://github.com/Hackpig1974/domain-expiry) with a modern web interface featuring:

- 🎨 **Light/Dark/System Themes** - Automatic theme switching that follows your OS
- 📊 **Color-Coded Status** - Red (≤3 months), Yellow (3-6 months), Green (>6 months)
- ⏱️ **Live Countdown** - Shows time until next refresh
- 🔄 **Auto-Refresh** - Configurable interval (default 1 hour)
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🌍 **Locale-Aware Date Formatting** - Auto-detects browser locale or choose from 5 manual formats
- ⚡ **Zero Dependencies** - Pure HTML/CSS/JavaScript + nginx

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose installed
- Available ports: 80 (web UI) and 8088 (API)

### Installation

**Step 1: Clone Repository**
```bash
git clone https://github.com/Hackpig1974/domain-expiry-web.git
cd domain-expiry-web
```

**Step 2: Configure Environment**
```bash
cp .env.example .env
nano .env
```

Add your domains:
```env
DOMAINS=example.com,mysite.com,portfolio.io
ALERT_DAYS=183
```

**Step 3: Start Services**
```bash
docker compose up -d
```

**Step 4: Access Web UI**

Open your browser to:
- **Local**: http://localhost
- **Remote**: http://YOUR_SERVER_IP

Done! The web UI will automatically pull domain data from the API.

---

## 📁 Project Structure

```
domain-expiry-web/
├── compose.yml              # Docker Compose (API + Web UI)
├── .env.example             # Configuration template
├── .env                     # Your configuration (create this)
└── webserver/               # Web UI files
    ├── index.html          # Main page
    ├── style.css           # Styling with theme support
    ├── app.js              # Application logic
    ├── config.js           # User-editable settings
    └── nginx.conf          # Nginx proxy configuration
```

---

## ⚙️ Configuration

### Environment Variables (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DOMAINS` | ✅ Yes | - | Comma-separated list of domains |
| `RDAP_BASE` | ✅ Yes | - | RDAP server (use `https://rdap.org/domain`) |
| `ALERT_DAYS` | ✅ Yes | - | Show alert when days ≤ this value |
| `REFRESH_MINUTES` | No | 360 | API cache duration (6 hours) |
| `TZ` | No | UTC | Timezone (e.g., `America/Denver`) |
| `WHOIS_FALLBACK_ENABLED` | No | false | Enable WHOIS fallback for .uk/.ca/.fr |
| `WHOISXML_API_KEY` | No | - | API key for ALL TLDs (500 free/month) |

### Web UI Settings (webserver/config.js)

```javascript
const CONFIG = {
  apiUrl: '/api',              // API endpoint (proxied through nginx)
  refreshInterval: 3600000,    // 1 hour in milliseconds
  thresholds: {
    red: 90,                   // Alert threshold (3 months)
    yellow: 184                // Warning threshold (6 months)
  }
};
```

**Change Refresh Interval:**
- 15 minutes: `900000`
- 30 minutes: `1800000`
- 1 hour: `3600000` (default)
- 2 hours: `7200000`

### Port Configuration

Edit `compose.yml` to change ports:

```yaml
ports:
  - "8089:80"  # Web UI now on port 8089
  - "8090:8000"  # API now on port 8090
```

---

## 🎨 Features

### Theme System
- **Light Theme**: Clean white/gray design
- **Dark Theme**: Blue-green slate accents
- **System Theme**: Follows OS preference automatically
- **Persistent**: Theme choice saved in browser

### Color-Coded Status
- 🔴 **Red**: ≤90 days remaining (3 months)
- 🟡 **Yellow**: 91-184 days (3-6 months)
- 🟢 **Green**: >184 days (over 6 months)
- ⚪ **Gray**: Status unknown

### Date Format
- **⚙️ Settings gear** (top right) opens the date format panel
- **🌐 Auto (Browser Locale)**: Default — uses `Intl.DateTimeFormat` to match the user's browser region automatically
- **Manual options**: DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY, MM-DD-YYYY, YYYY-MM-DD
- **Persistent**: Format choice saved in browser `localStorage`

### Live Countdown
Footer displays time until next auto-refresh: `Next refresh: 59m 30s`

### Manual Refresh
Click "🔄 Refresh Now" to update immediately and reset countdown.

---

## 🔧 Troubleshooting

### Web UI Not Loading

**Check containers are running:**
```bash
docker ps
```

Should see both `domain-expiry` and `domain-expiry-web`.

**Check logs:**
```bash
docker logs domain-expiry
docker logs domain-expiry-web
```

### Domains Showing N/A

API may not be able to fetch domain data. Options:

1. **Enable WHOIS fallback** (for .uk, .ca, .fr):
   ```env
   WHOIS_FALLBACK_ENABLED=true
   ```

2. **Add WhoisXML API key** (for ALL TLDs):
   ```env
   WHOISXML_API_KEY=your-key-here
   ```
   Get free key: https://whoisxmlapi.com (500 requests/month)

**Restart after config changes:**
```bash
docker compose restart
```

### Port Already in Use

If port 80 is occupied:

```yaml
# In compose.yml
ports:
  - "8089:80"  # Change to any available port
```

Then access via: http://localhost:8089

---

## 🔄 Updating

**Update both containers:**
```bash
docker compose pull
docker compose up -d
```

**Update only web UI files:**
Just edit files in `webserver/` directory and restart:
```bash
docker compose restart domain-expiry-web
```

---

## 📊 How It Works

```
┌─────────────────┐
│   Browser       │
│  (port 80)      │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  nginx:alpine   │  Serves static HTML/CSS/JS
│  (Web UI)       │  Proxies /api/* to backend
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  FastAPI        │  Domain expiry data
│  (API)          │  RDAP/WHOIS queries
└─────────────────┘
```

**Data Flow:**
1. Browser loads static files from nginx
2. JavaScript fetches `/api/status` (proxied to API container)
3. API queries RDAP/WHOIS for domain data
4. JavaScript updates table with color-coded results
5. Auto-refresh repeats every hour

---

## 💡 Tips & Best Practices

### Performance
- Keep refresh interval at 1+ hour (API caches for 6 hours)
- Monitor 10-20 domains max per instance
- Web UI adds minimal overhead (~15MB RAM)

### Security
- Don't expose to internet without authentication
- Run behind reverse proxy (nginx/Traefik) with auth
- No sensitive data stored (public WHOIS info only)

### Deployment
- Keep `webserver/` directory clean for Git updates
- Edit `config.js` for site-specific settings
- Edit `.env` for domain list changes

---

## 🆚 vs Homepage Integration

**Use domain-expiry-web when:**
- ✅ You want a standalone dashboard
- ✅ You don't use Homepage
- ✅ You want theme customization
- ✅ You prefer a dedicated interface

**Use domain-expiry (original) when:**
- ✅ You already use Homepage dashboard
- ✅ You want all services in one place
- ✅ You need Homepage's widget features

Both can run simultaneously on different ports.

### 🎨 Color Coding Difference

**Original domain-expiry (Homepage):**
- Shows 🔴 red emoji when domain expires in ≤183 days (configurable via ALERT_DAYS)
- No visual indicator for domains with >183 days remaining
- Single threshold based on ALERT_DAYS setting

**domain-expiry-web:**
- Three-tier color system: Red (≤90d) / Yellow (91-184d) / Green (>184d)
- Visual status for ALL domains at a glance
- Independent thresholds (configurable in webserver/config.js)
- Themed colors adapt to Light/Dark mode

---

## 🤝 Contributing

Found a bug or want a feature?

1. Open an issue describing the problem or request
2. Submit a PR with improvements
3. Share screenshots of your setup!

---

## 📚 Related Projects

- [Domain Expiry API](https://github.com/Hackpig1974/domain-expiry) - The backend service
- [Homepage](https://gethomepage.dev/) - Alternative dashboard platform
- [nginx](https://nginx.org/) - Web server powering the UI

---

## 📄 License

GPL-3.0 License - see LICENSE file

---

## 🙏 Acknowledgments

Built on the [Domain Expiry API](https://github.com/Hackpig1974/domain-expiry) by @Hackpig1974

---

Made with ❤️ for the homelab community
