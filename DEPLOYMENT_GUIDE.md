# Deployment Guide

This guide walks you through deploying the Fund Rating Survey POC to Cloudflare Pages and GitHub Pages.

## Prerequisites

- GitHub account
- Cloudflare account (free tier is sufficient)
- Git installed locally

## Step 1: Create Cloudflare D1 Database

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Create the D1 database:
   ```bash
   wrangler d1 create fund-rating-db
   ```

4. Copy the database ID from the output. It will look like:
   ```
   database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   ```

5. Update `wrangler.toml` with your database ID:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "fund-rating-db"
   database_id = "YOUR_DATABASE_ID_HERE"  # Replace this
   ```

6. Apply the database schema:
   ```bash
   wrangler d1 execute fund-rating-db --remote --file=schema.sql
   ```

## Step 2: Get Cloudflare Credentials

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)

2. Get your **Account ID**:
   - Click on "Workers & Pages" in the left sidebar
   - Your Account ID is displayed on the right side
   - Copy it

3. Create an **API Token**:
   - Go to "My Profile" → "API Tokens"
   - Click "Create Token"
   - Use the "Edit Cloudflare Workers" template
   - Add permissions:
     - Account > Cloudflare Pages > Edit
     - Account > D1 > Edit
   - Click "Continue to summary" → "Create Token"
   - **Copy the token immediately** (you won't see it again)

## Step 3: Push to GitHub

1. Initialize git repository (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a new repository on GitHub (don't initialize with README)

3. Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/data-collector.git
   git branch -M main
   git push -u origin main
   ```

## Step 4: Configure GitHub Secrets

1. Go to your GitHub repository
2. Click "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret"

Add these two secrets:

**Secret 1: CF_ACCOUNT_ID**
- Name: `CF_ACCOUNT_ID`
- Value: Your Cloudflare Account ID from Step 2

**Secret 2: CF_API_TOKEN**
- Name: `CF_API_TOKEN`
- Value: Your Cloudflare API Token from Step 2

## Step 5: Enable GitHub Pages

1. Go to repository "Settings" → "Pages"
2. Under "Source", select "GitHub Actions"
3. Save

## Step 6: Trigger First Deployment

1. Go to "Actions" tab in your GitHub repository
2. Click on "Deploy to Cloudflare Pages" workflow
3. Click "Run workflow" → "Run workflow"

Wait for the deployment to complete (usually 2-3 minutes)

## Step 7: Update API Configuration

1. After deployment completes, go to Cloudflare Dashboard → "Workers & Pages"
2. Find your "data-collector" project
3. Copy the deployment URL (e.g., `https://data-collector-abc.pages.dev`)

4. Update `frontend/js/config.js`:
   ```javascript
   export const API_BASE_URL = isLocal
     ? 'http://localhost:8788/api'
     : 'https://YOUR-PROJECT-NAME.pages.dev/api';  // Update this line
   ```

5. Commit and push:
   ```bash
   git add frontend/js/config.js
   git commit -m "Update API URL with production endpoint"
   git push
   ```

## Step 8: Access Your Application

After the second deployment completes:

- **Frontend (GitHub Pages)**: `https://YOUR_USERNAME.github.io/data-collector/`
- **Backend API (Cloudflare)**: `https://YOUR-PROJECT-NAME.pages.dev/api`

## Testing the Deployment

1. Open the GitHub Pages URL
2. Click "New Counterparty"
3. Register a test fund
4. Complete all three stages
5. Check the dashboard to see your entry

## Troubleshooting

### Deployment fails at "Apply D1 Schema"
- Verify your `CF_API_TOKEN` secret has D1 permissions
- Check the database ID in `wrangler.toml` is correct

### Frontend shows "Failed to fetch" errors
- Ensure you updated the API URL in `frontend/js/config.js`
- Check browser console for the actual URL being called
- Verify Cloudflare Pages deployment succeeded

### 404 errors on API calls
- Check Cloudflare Pages deployment logs
- Ensure functions are in the correct directory structure
- Verify CORS headers are being returned

### GitHub Pages shows 404
- Ensure GitHub Pages is enabled in repository settings
- Check that "Source" is set to "GitHub Actions"
- Wait a few minutes for DNS propagation

## Local Development

To run locally before deploying:

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Access at http://localhost:8788
```

## Updating the Application

After initial deployment, any push to the `main` branch will automatically:
1. Apply schema changes to D1
2. Deploy backend to Cloudflare Pages
3. Deploy frontend to GitHub Pages

## Cost Estimation

With the free tiers:
- **Cloudflare Pages**: 500 builds/month, unlimited requests
- **Cloudflare D1**: 100,000 reads/day, 50,000 writes/day
- **GitHub Pages**: Unlimited for public repositories

This POC should run completely free for development and testing purposes.

## Next Steps

- Customize Stage 3 questions in `functions/utils/stage3-config.ts`
- Adjust rating algorithms in `functions/utils/calculations.ts`
- Modify styling in `frontend/css/styles.css`
- Add more features as needed

## Support

If you encounter issues:
1. Check the GitHub Actions logs
2. Review Cloudflare Pages deployment logs
3. Check browser console for frontend errors
4. Refer to CLAUDE.md for troubleshooting tips
