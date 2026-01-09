// Domain Expiry Web UI Configuration
// Edit these values to match your setup

const CONFIG = {
  // API endpoint URL - proxied through nginx, no CORS issues
  // /api routes are forwarded to the domain-expiry container internally
  // If you need to access API directly: 'http://localhost:8088'
  apiUrl: '/api',
  
  // How often to refresh data from API (in milliseconds)
  // Default: 3600000 = 1 hour
  // Examples:
  //   15 minutes: 900000
  //   30 minutes: 1800000
  //   1 hour: 3600000
  refreshInterval: 3600000,
  
  // Color thresholds (in days)
  thresholds: {
    red: 90,       // <= 90 days (3 months)
    yellow: 184    // 91-184 days (3-6 months), >184 is green
  }
};
