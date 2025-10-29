# Fund Rating Survey - POC

A multi-stage survey system for rating counterparty funds, built with Cloudflare Pages Functions and D1 database.

## Overview

This application provides a structured 3-stage questionnaire that collects portfolio information and calculates risk ratings for counterparty funds. The rating system uses configurable algorithms based on portfolio composition, sector allocation, and risk assessment answers.

## Features

- **Multi-stage workflow** with intelligent routing logic
- **Dynamic form rows** with weight validation (must sum to 1.0)
- **Configurable rating algorithms** with sector and category scoring
- **Dashboard** for viewing and searching counterparties
- **Review and edit** functionality for completed surveys
- **Serverless architecture** using Cloudflare infrastructure

## Architecture

- **Frontend**: Static HTML/CSS/JavaScript (ES6 modules)
- **Backend**: Cloudflare Pages Functions (TypeScript)
- **Database**: Cloudflare D1 (SQLite)
- **CI/CD**: GitHub Actions for automated deployment

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account (free tier works)
- Wrangler CLI: `npm install -g wrangler`

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Initialize the database**:
   ```bash
   chmod +x init-test-db.sh
   npm run init-db
   ```

   This will:
   - Create the local D1 database
   - Apply the schema
   - Seed test data (3 sample counterparties)

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   ```
   http://localhost:8788
   ```

### Available npm Scripts

```bash
npm run dev         # Start local dev server with database binding
npm run init-db     # Initialize/reset local database with test data
npm run seed        # Seed test data only (requires existing schema)
npm run reset-db    # Completely reset database (removes all data)
npm run deploy      # Deploy to Cloudflare Pages
npm run schema      # Apply schema to remote database
```

## Test Data

The initialization script creates 3 test counterparties:

1. **Alpha Fund (FUND001)** - Route A, Final Rating: 1
2. **test2 (434342)** - Route B, Final Rating: 3
3. **debug fund (debug001)** - Route A, Final Rating: 3

All test cases have completed all survey stages and can be used for testing the review/edit functionality.

## Project Structure

```
data_collector/
├── frontend/                 # Static frontend files
│   ├── css/
│   │   └── styles.css       # Global styles with CSS variables
│   ├── js/
│   │   ├── api.js          # API client wrapper
│   │   ├── app.js          # Common utilities
│   │   └── config.js       # API base URL configuration
│   ├── index.html          # Dashboard
│   ├── new.html            # Create counterparty
│   ├── stage1.html         # Stage 1: Three yes/no questions
│   ├── stage2a.html        # Stage 2A: Route A portfolio data
│   ├── stage2b.html        # Stage 2B: Route B portfolio data
│   ├── stage3.html         # Stage 3: Ten risk questions
│   ├── review.html         # View survey summary
│   └── edit.html           # Edit completed survey
├── functions/               # Cloudflare Pages Functions (API)
│   ├── api/
│   │   ├── counterparties.ts        # Create/list counterparties
│   │   ├── dashboard.ts             # Dashboard endpoint
│   │   ├── stage1/[id].ts          # Stage 1 submission
│   │   ├── stage2/[id].ts          # Stage 2 submission
│   │   ├── stage3/[id].ts          # Stage 3 questions/submission
│   │   └── summary/[id].ts         # Complete summary
│   └── utils/
│       ├── calculations.ts          # Rating algorithms
│       ├── db.ts                    # Database utilities
│       └── stage3-config.ts         # Stage 3 question config
├── schema.sql               # Database schema definition
├── seed-test-data.sql       # Test data SQL
├── init-test-db.sh          # Database initialization script
├── wrangler.toml            # Cloudflare configuration
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── CLAUDE.md                # Developer guide for Claude Code
├── DEPLOYMENT_GUIDE.md      # Detailed deployment instructions
├── IMPLEMENTATION_PLAN.md   # Technical specification
└── QUICK_START.md           # Quick deployment guide
```

## Survey Workflow

### Stage 1: Initial Questions
- 3 yes/no questions
- Determines routing: Route A (≥2 "yes") or Route B (<2 "yes")
- Saves routing result for subsequent stages

### Stage 2: Portfolio Data
**Route A (Option 1)**: Underline + Sector + Weight
- Dynamic rows with underline, sector selection, and weight
- Weights must sum to 1.0

**Route B (Option 2)**: Category + Sector + Weight
- Dynamic rows with category, sector selection, and weight
- Weights must sum to 1.0

**Base Rating Calculation**:
- Calculated using sector scores and category factors
- Result: 1-6 scale rating

### Stage 3: Risk Assessment
- 10 multiple-choice questions
- Each question has a weight (sum to 1.0)
- Each choice has a notch value (-3 to +3)
- Weighted notch calculation applied to base rating

### Final Rating
```
final_rating = clamp(round(base_rating + weighted_notch), 1, 6)
```

**Important**: When Stage 2 is updated (base rating changes), the final rating is automatically recalculated using existing Stage 3 answers without requiring re-entry.

## API Endpoints

### Counterparty Management
- `POST /api/counterparties` - Create new counterparty
- `GET /api/counterparties?search=...&limit=50&offset=0` - List/search

### Survey Stages
- `POST /api/stage1/:id` - Submit Stage 1 (q1, q2, q3 booleans)
- `GET /api/stage2/:id` - Get Stage 2 data
- `POST /api/stage2/:id` - Submit Stage 2 (option, rows array)
- `GET /api/stage3/:id` - Get Stage 3 questions
- `POST /api/stage3/:id` - Submit Stage 3 (answers array)

### Dashboard & Review
- `GET /api/dashboard?search=...&limit=50&offset=0` - Dashboard data
- `GET /api/summary/:id` - Complete survey summary

All endpoints support CORS and return JSON responses.

## Database Schema

**Tables**:
1. `counterparty` - Main entity (id, cp_id, name, created_at)
2. `stage1` - Three questions + route (q1, q2, q3, route)
3. `stage2_opt1_row` - Route A rows (underline, sector, weight)
4. `stage2_opt2_row` - Route B rows (category, sector, weight)
5. `stage2_result` - Base rating calculation (option, base_rating)
6. `stage3_answer` - Ten answers (question_no, choice_key)
7. `rating_result` - Final rating (base_rating, weighted_notch, final_rating)

**Key Points**:
- All tables reference `counterparty.id`
- No foreign key cascades (manual cleanup required)
- Uses SQLite syntax (`datetime('now')`, `||` for concat)
- Timestamps stored in ISO 8601 format

## Rating Algorithms

### Stage 1 Routing
```typescript
sum = (q1 ? 1 : 0) + (q2 ? 1 : 0) + (q3 ? 1 : 0)
route = sum >= 2 ? 'A' : 'B'
```

### Stage 2A Base Rating (Route A)
```typescript
// Sector scores: Sector 1 = 0.2, Sector 2 = 0.4, Sector 3 = 0.6
weighted_score = Σ(weight * sector_score)
base_rating = clamp(ceil(weighted_score * 6), 1, 6)
```

### Stage 2B Base Rating (Route B)
```typescript
// Category factors: 0.8, 1.0, 1.2
// Sector scores: 0.1 to 1.0 (10 sectors)
weighted_score = Σ(weight * category_factor * sector_score)
normalized = weighted_score / 1.2
base_rating = clamp(ceil(normalized * 6), 1, 6)
```

### Stage 3 Final Rating
```typescript
weighted_notch = Σ(question_weight * choice_notch)
final_rating = clamp(round(base_rating + weighted_notch), 1, 6)
```

**Configuration**: See `functions/utils/stage3-config.ts` for question weights and choice notch values.

## Customization

### Modify Rating Algorithms
Edit `functions/utils/calculations.ts`:
- Adjust `SECTOR_SCORES` constants
- Adjust `CATEGORY_FACTORS` constants
- Modify calculation formulas

### Change Stage 3 Questions
Edit `functions/utils/stage3-config.ts`:
- Add/remove questions
- Adjust question weights (must sum to 1.0)
- Modify choice notch values

### Update Styling
Edit `frontend/css/styles.css`:
- CSS custom properties in `:root`
- Responsive breakpoint at 768px

## Deployment

See **DEPLOYMENT_GUIDE.md** for detailed instructions.

### Quick Deployment Steps

1. **Create Cloudflare D1 database**:
   ```bash
   wrangler d1 create fund-rating-db
   ```

2. **Update `wrangler.toml`** with database ID

3. **Apply schema**:
   ```bash
   npm run schema
   ```

4. **Set GitHub secrets**:
   - `CF_ACCOUNT_ID`
   - `CF_API_TOKEN`

5. **Push to GitHub** - Auto-deploys via GitHub Actions

6. **Update API URL** in `frontend/js/config.js` with your Cloudflare Pages URL

## Troubleshooting

### Database not found
- Verify `wrangler.toml` has correct `database_id`
- Check: `wrangler d1 list`

### API returns empty data
- Ensure dev command uses correct binding: `--binding DB=fund-rating-db`
- Restart dev server after database changes

### CORS errors
- All endpoints must export `onRequestOptions` handler
- Check `functions/utils/db.ts:corsHeaders()`

### Weight validation fails
- Weights must sum to exactly 1.0 (tolerance ±0.01)
- Example: 0.5 + 0.3 + 0.2 = 1.0

### Final rating not updating after Stage 2 edit
- This should happen automatically as of the latest update
- Check `functions/api/stage2/[id].ts` includes recalculation logic

## Development Tips

### Database Access
```bash
# Query local database
wrangler d1 execute fund-rating-db --local --command="SELECT * FROM counterparty"

# Query remote database
wrangler d1 execute fund-rating-db --remote --command="SELECT * FROM counterparty"
```

### Reset Database
```bash
# Complete reset (removes all data)
npm run reset-db

# Or manually
rm -rf .wrangler/state/v3/d1
npm run init-db
```

### Test with curl
```bash
# Create counterparty
curl -X POST http://localhost:8788/api/counterparties \
  -H 'Content-Type: application/json' \
  -d '{"cp_id":"TEST001","name":"Test Fund"}'

# List all
curl http://localhost:8788/api/counterparties
```

## Documentation

- **README.md** (this file) - Overview and getting started
- **CLAUDE.md** - Comprehensive developer guide for AI assistance
- **DEPLOYMENT_GUIDE.md** - Production deployment instructions
- **IMPLEMENTATION_PLAN.md** - Detailed technical specification
- **QUICK_START.md** - Quick deployment guide for new users

## Known Limitations

- No user authentication (public endpoints)
- No audit trail or version history
- Single-threaded SQLite (D1) - concurrent writes may conflict
- Weight validation tolerance is ±0.01 (floating point precision)
- No cascading deletes (orphan data possible)

## License

MIT
