# Domain Monitor

A domain monitoring application that integrates with n8n workflows, Cloudflare, and provides a Next.js dashboard to monitor website status and domain renewal dates.

## Features

### Dashboard Overview
- **Website Status Monitoring**
  - RED: Sites returning non-200 status (down)
  - YELLOW: Sites with 301/302 redirects
  - GREEN: Sites with 200 status (healthy)

- **Renewal Status Monitoring**
  - RED: Expired domains
  - YELLOW: Domains expiring within 2 weeks
  - GREEN: Domains with more than 2 weeks until expiration

### Domain Detail Page
- Domain name and status badges
- Expiration date with days remaining
- Name servers list
- Domain host/registrar
- HTTP status with explanation
- Public DNS records table (A, AAAA, CNAME, MX, TXT, NS)

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Cloudflare    │────▶│      n8n        │────▶│   Next.js App   │
│   (Domains)     │     │  (Workflows +   │     │   (Frontend)    │
│                 │     │   Data Tables)  │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd domain-monitor
npm install
```

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and update:

```bash
# n8n Configuration
N8N_WEBHOOK_BASE_URL=http://localhost:5678/webhook
# N8N_AUTH_HEADER=Bearer your-token  # Optional

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up n8n Data Tables

In your n8n instance, create the following data tables:

#### Table: `domains`
| Column | Type |
|--------|------|
| domain | String |
| httpStatus | Number |
| statusCategory | String |
| registrar | String |
| nameServers | String |
| expirationDate | DateTime |
| lastChecked | DateTime |
| cloudflareZoneId | String |
| renewalStatus | String |
| daysUntilExpiration | Number |

#### Table: `status_checks` (for historical data)
| Column | Type |
|--------|------|
| domain | String |
| httpStatus | Number |
| checkedAt | DateTime |

### 4. Import n8n Workflows

Import the workflow JSON files from `n8n-workflows/` directory:

1. **1-sync-domains-from-cloudflare.json** - Syncs domains from Cloudflare, checks status, and updates data table
2. **2-get-domains.json** - Returns all domains for the frontend
3. **3-scheduled-status-check.json** - Periodic status checks (runs hourly)

#### Configure Cloudflare Credentials in n8n

1. Go to n8n Settings > Credentials
2. Add new "Cloudflare API" credential
3. Enter your Cloudflare API Token (needs Zone:Read permission)
4. Update the credential ID in the sync workflow

### 5. Start the Application

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### 6. Test the Setup

1. Open http://localhost:3000
2. Click "Sync Now" to trigger the n8n sync workflow
3. Verify domains appear in the dashboard
4. Click on a domain to see the detail page

## Project Structure

```
domain-monitor/
├── app/
│   ├── api/
│   │   ├── domains/route.ts      # Proxy to n8n get-domains
│   │   ├── sync/route.ts         # Trigger n8n sync
│   │   └── dns/[domain]/route.ts # Fetch public DNS records
│   ├── domains/[domain]/page.tsx # Domain detail page
│   ├── layout.tsx
│   ├── page.tsx                  # Dashboard
│   └── globals.css
├── components/
│   ├── ui/                       # Card, Badge, Button, Skeleton
│   ├── status-section.tsx        # Status section with indicators
│   ├── status-indicator.tsx      # RED/YELLOW/GREEN indicators
│   ├── domain-list.tsx           # Expandable domain list
│   ├── dns-records-table.tsx     # DNS records display
│   └── header.tsx                # App header with sync button
├── lib/
│   ├── utils.ts                  # Utility functions
│   ├── types.ts                  # TypeScript interfaces
│   └── domain-context.tsx        # React context for data
├── n8n-workflows/                # Importable n8n workflows
└── .env.local
```

## Deployment

### Vercel Deployment

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `N8N_WEBHOOK_BASE_URL`: Your n8n webhook URL (must be publicly accessible)
   - `N8N_AUTH_HEADER`: Optional authentication header

### n8n Production Setup

For production, ensure your n8n instance is:
- Accessible from Vercel (public URL or VPN)
- Has proper authentication configured
- Webhooks are active and workflows are enabled

## API Endpoints

### GET /api/domains
Returns all domains with status information.

### POST /api/sync
Triggers the n8n sync workflow to update domain data.

### GET /api/dns/[domain]
Fetches public DNS records for a specific domain using Google DNS-over-HTTPS.

## Development

The app includes mock data that's used when n8n is not configured, making it easy to develop and test the UI without a running n8n instance.

```bash
# Run development server with mock data
npm run dev
```

## License

MIT
