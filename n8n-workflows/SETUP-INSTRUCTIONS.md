# n8n Workflow Setup Instructions

Since browser automation cannot handle native file dialogs, please follow these manual steps to import the workflows.

## Method 1: Import via n8n UI

1. In n8n, go to a workflow editor
2. Press `Ctrl+O` (or Cmd+O on Mac) to open the menu
3. Click "Import from file..."
4. Navigate to `/Users/rober/Windsurf/domain-monitor/n8n-workflows/`
5. Select the workflow JSON file to import

Import these files in order:
- `2-get-domains.json` - Get All Domains webhook
- `1-sync-domains-from-cloudflare.json` - Sync from Cloudflare

## Method 2: Copy-Paste JSON

1. Open the workflow JSON file in a text editor
2. Copy all the JSON content
3. In n8n workflow editor, press `Ctrl+V` (or Cmd+V) to paste
4. The workflow will be imported

## After Import

1. **Update Data Table References**:
   - Open each workflow
   - Find the "n8n Tables" nodes
   - Update the `tableId` to match your "domains" table ID
   - You can find your table ID in the URL when viewing the data table

2. **Configure Cloudflare Credentials** (for sync workflow):
   - Go to n8n Settings > Credentials
   - Add new "Cloudflare API" credential
   - Use an API Token with Zone:Read permission

3. **Activate Workflows**:
   - Toggle the workflow to "Active" in the top right
   - This enables the webhook endpoints

## Webhook URLs

After activation, your webhook URLs will be:
- Get Domains: `http://localhost:5678/webhook/get-domains`
- Sync Domains: `http://localhost:5678/webhook/sync-domains`

## Testing

Test the Get Domains webhook:
```bash
curl -X POST http://localhost:5678/webhook/get-domains
```

Test the Sync webhook:
```bash
curl -X POST http://localhost:5678/webhook/sync-domains
```
