# 🌐 Domain Expiration Monitor - Web UI

A standalone web dashboard for monitoring domain renewals. This project extends the [Domain Expiry API](https://github.com/Hackpig1974/domain-expiry) with a modern web interface featuring:

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

**Step 1: Create a project directory**
```bash
mkdir domain-expiry-web
cd domain-expiry-web
```

**Step 2: Download the required files**
```bash
wget https://raw.githubusercontent.com/Hackpig1974/domain-expiry-web/main/compose.yml
wget https://raw.githubusercontent.com/Hackpig1974/domain-expiry-web/main/.env.example -O .env
```

**Step 3: Configure your domains**
```bash
nano .env
```

Add your domains:
```env
DOMAINS=example.com,mysite.com,portfolio.io
RDAP_BASE=https://rdap.org/domain
ALERT_DAYS=183
TZ=America/Denver
```

**Step 4: Start Services**
```bash
docker compose up -d
```

Docker will pull both images automatically on first run. No local web files needed.

**Step 5: Access Web UI**

Open your browser to:
- **Local**: http://localhost
- **Remote**: http://YOUR_SERVER_IP

---

## 🔄 Updating

Both containers are published to Docker Hub. Updates to the web UI and API are delivered via new image versions:

```bash
docker compose pull
docker compose up -d
```

That's it — no git, no local file management.

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

### Port Configuration

Edit `compose.yml` to change ports:

```yaml
ports:
  - "8089:80"   # Web UI on port 8089
  - "8090:8000" # API on port 8090
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
- **Persistent**: Format choice saved in browser localStorage

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

Should see both `domain-expiry` and `domain-expiry-webserver`.

**Check logs:**
```bash
docker logs domain-expiry
docker logs domain-expiry-webserver
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

If port 80 is occupied, edit `compose.yml`:

```yaml
ports:
  - "8089:80"
```

Then access via: http://localhost:8089

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
│  domain-expiry  │  Serves static HTML/CSS/JS
│  -webserver     │  Proxies /api/* to backend
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  domain-expiry  │  Domain expiry data
│  (API)          │  RDAP/WHOIS queries
└─────────────────┘
```

**Data Flow:**
1. Browser loads static files from the webserver container
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
- Independent thresholds (configurable via Settings panel in UI)
- Themed colors adapt to Light/Dark mode

---

## 🤝 Contributing

Found a bug or want a feature?

1. Open an issue describing the problem or request
2. Submit a PR with improvements
3. Share screenshots of your setup!

---

## 🛠️ Development

Want to modify the web UI or build your own image:

```bash
git clone https://github.com/Hackpig1974/domain-expiry-web.git
cd domain-expiry-web
```

Edit files in `webserver/`, then build locally:

```bash
docker build -t domain-expiry-webserver:dev .
```

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
