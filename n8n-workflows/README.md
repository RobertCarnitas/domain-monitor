# n8n Workflows Setup Guide

This directory contains the n8n workflow JSON files for the Domain Monitor application.

## Prerequisites

1. n8n instance running (self-hosted or cloud)
2. Cloudflare account with API token
3. n8n Data Tables feature enabled

## Data Tables Setup

Before importing workflows, create these data tables in n8n:

### Table: `domains`

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| domain | Text | Domain name (primary key) |
| httpStatus | Number | HTTP status code from last check |
| statusCategory | Text | 'healthy', 'redirect', or 'down' |
| registrar | Text | Domain registrar name |
| nameServers | Text | Comma-separated name servers |
| expirationDate | Date | Domain expiration date |
| lastChecked | Date | Timestamp of last status check |
| cloudflareZoneId | Text | Cloudflare zone identifier |
| renewalStatus | Text | 'healthy', 'warning', 'expired', 'unknown' |
| daysUntilExpiration | Number | Days until domain expires |

### Table: `status_checks` (Optional - for historical tracking)

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| domain | Text | Domain name |
| httpStatus | Number | HTTP status code |
| checkedAt | Date | Timestamp of check |

## Cloudflare API Credential

1. Go to Cloudflare Dashboard > My Profile > API Tokens
2. Create a new token with "Zone:Read" permission
3. In n8n, go to Settings > Credentials > Add Credential
4. Select "Cloudflare API"
5. Enter your API token
6. Save and note the credential ID

## Workflow Import Instructions

### 1. Sync Domains from Cloudflare (`1-sync-domains-from-cloudflare.json`)

**Purpose:** Pulls all domains from Cloudflare, checks website status, fetches WHOIS data, and stores in data table.

**Webhook URL:** `POST /webhook/sync-domains`

**Setup:**
1. Import the workflow JSON
2. Update the Cloudflare credential in the "Cloudflare - List Zones" node
3. Verify the data table ID matches your "domains" table
4. Activate the workflow

**Flow:**
```
Webhook → Cloudflare API → Split Zones → Batch Process →
  ├─ Check Website Status (HEAD request)
  └─ WHOIS/RDAP Lookup
→ Merge → Process Data → Upsert to Data Table → Response
```

### 2. Get All Domains (`2-get-domains.json`)

**Purpose:** Returns all domains from the data table with calculated renewal status.

**Webhook URL:** `POST /webhook/get-domains`

**Setup:**
1. Import the workflow JSON
2. Verify the data table ID matches your "domains" table
3. Activate the workflow

**Flow:**
```
Webhook → Read Data Table → Calculate Renewal Status → Response
```

### 3. Scheduled Status Check (`3-scheduled-status-check.json`)

**Purpose:** Periodically checks website status for all domains (runs every hour).

**Trigger:** Schedule (every 1 hour)

**Setup:**
1. Import the workflow JSON
2. Verify the data table IDs match your tables
3. Adjust schedule interval if needed
4. Activate the workflow

**Flow:**
```
Schedule → Read Domains → Batch → Check Status → Process →
  ├─ Update Data Table
  └─ Log to status_checks
```

## Testing Workflows

### Test Sync Workflow

```bash
curl -X POST http://localhost:5678/webhook/sync-domains
```

Expected response:
```json
{
  "success": true,
  "domainsProcessed": 5,
  "domainsUpdated": 5,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Test Get Domains Workflow

```bash
curl -X POST http://localhost:5678/webhook/get-domains
```

Expected response:
```json
[
  {
    "id": "1",
    "domain": "example.com",
    "httpStatus": 200,
    "statusCategory": "healthy",
    "registrar": "Cloudflare",
    "nameServers": "ns1.cloudflare.com, ns2.cloudflare.com",
    "expirationDate": "2025-06-15T00:00:00.000Z",
    "renewalStatus": "healthy",
    "daysUntilExpiration": 150
  }
]
```

## Troubleshooting

### Workflow not triggering
- Ensure workflow is activated (toggle on)
- Check webhook URL is correct
- Verify n8n is accessible from your network

### Cloudflare API errors
- Verify API token has Zone:Read permission
- Check token hasn't expired
- Ensure credential is properly linked in workflow

### Data not saving to table
- Verify data table exists with correct columns
- Check column names match exactly (case-sensitive)
- Ensure n8n has write permissions

### WHOIS lookup failing
- RDAP API may not support all TLDs
- Some domains may have privacy protection
- Consider using a paid WHOIS API for better coverage

## Alternative WHOIS APIs

The default workflow uses the free RDAP protocol. For better coverage, consider:

1. **WhoisJSON API** (Paid)
   - URL: `https://whoisjson.com/api/v1/whois?domain={domain}`
   - Requires API key

2. **WHOISXML API** (Freemium)
   - URL: `https://www.whoisxmlapi.com/whoisserver/WhoisService`
   - 500 free queries/month

3. **Verisign RDAP** (Free, .com/.net only)
   - URL: `https://rdap.verisign.com/com/v1/domain/{domain}`
