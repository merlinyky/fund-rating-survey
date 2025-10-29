# Quick Start Guide

Get the Fund Rating Survey POC up and running in 10 minutes.

## What You'll Get

A fully functional multi-stage survey system with:
- ✅ Counterparty registration
- ✅ 3-stage questionnaire with routing logic
- ✅ Dynamic form rows with validation
- ✅ Automated rating calculations
- ✅ Dashboard with search
- ✅ Review and edit functionality

## Prerequisites

- GitHub account
- Cloudflare account (free tier)
- Terminal/command line access

## 5-Step Deployment

### 1️⃣ Setup Cloudflare (3 mins)

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Create database
wrangler d1 create fund-rating-db
```

📋 **Copy the database ID** from the output

✏️ **Edit `wrangler.toml`** and replace `database_id = "placeholder-to-be-replaced"`

```bash
# Apply schema
wrangler d1 execute fund-rating-db --remote --file=schema.sql
```

### 2️⃣ Get Cloudflare Credentials (2 mins)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Copy your **Account ID** (top right on Workers & Pages screen)
3. Create **API Token**:
   - My Profile → API Tokens → Create Token
   - Use "Edit Cloudflare Workers" template
   - Add D1 edit permissions
   - Copy the token

### 3️⃣ Push to GitHub (1 min)

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/data-collector.git
git push -u origin main
```

### 4️⃣ Configure GitHub Secrets (2 mins)

In your GitHub repo: **Settings → Secrets and variables → Actions**

Add two secrets:
- `CF_ACCOUNT_ID` = Your Cloudflare Account ID
- `CF_API_TOKEN` = Your Cloudflare API Token

### 5️⃣ Deploy (2 mins)

1. **Enable GitHub Pages**: Settings → Pages → Source: "GitHub Actions"
2. **Run Workflow**: Actions tab → "Deploy to Cloudflare Pages" → Run workflow
3. **Wait** for deployment to complete (~2 minutes)

## Post-Deployment

### Update API URL

After first deployment:

1. Go to Cloudflare Dashboard → Workers & Pages → Find your project
2. Copy the URL (e.g., `https://data-collector-xyz.pages.dev`)
3. Edit `frontend/js/config.js`:
   ```javascript
   export const API_BASE_URL = isLocal
     ? 'http://localhost:8788/api'
     : 'https://YOUR-PROJECT.pages.dev/api';  // ← Update this
   ```
4. Commit and push again

### Access Your App

- **Frontend**: `https://YOUR_USERNAME.github.io/data-collector/`
- **API**: `https://YOUR-PROJECT.pages.dev/api`

## Test It Out

1. Click "New Counterparty"
2. Enter a test fund name
3. Answer Stage 1 questions (Yes/No)
4. Add portfolio rows in Stage 2 (weights must sum to 1.0)
5. Answer Stage 3 questions
6. View your final rating!

## Local Development

```bash
npm install
npm run dev
# Open http://localhost:8788
```

## Troubleshooting

**"Failed to fetch" errors?**
- Check that you updated the API URL in `config.js`
- Verify Cloudflare deployment succeeded

**API returns 404?**
- Ensure GitHub secrets are set correctly
- Check Cloudflare Pages deployment logs

**Weights validation fails?**
- Weights must sum to exactly 1.0 (e.g., 0.5 + 0.3 + 0.2)

## What's Next?

- **Customize questions**: Edit `functions/utils/stage3-config.ts`
- **Adjust algorithms**: Modify `functions/utils/calculations.ts`
- **Change styling**: Update `frontend/css/styles.css`
- **Add features**: See IMPLEMENTATION_PLAN.md for ideas

## File Structure

```
data_collector/
├── frontend/           # HTML, CSS, JS files
├── functions/          # API endpoints (TypeScript)
├── schema.sql          # Database structure
├── wrangler.toml       # Cloudflare config
└── .github/workflows/  # Auto-deployment
```

## Key Files to Know

- `frontend/js/config.js` - API URL (MUST UPDATE after first deploy)
- `functions/utils/calculations.ts` - Rating algorithms
- `functions/utils/stage3-config.ts` - Questions configuration
- `schema.sql` - Database tables

## Documentation

- **DEPLOYMENT_GUIDE.md** - Detailed deployment instructions
- **CLAUDE.md** - Development guide for Claude Code
- **IMPLEMENTATION_PLAN.md** - Full technical specification
- **README.md** - Project overview

## Need Help?

1. Check browser console for errors
2. Review GitHub Actions logs
3. Check Cloudflare Pages deployment logs
4. See CLAUDE.md troubleshooting section

---

**Enjoy your Fund Rating Survey POC!** 🎉
