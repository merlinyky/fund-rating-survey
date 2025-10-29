# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a fund rating survey POC system that collects information about counterparties through a multi-stage questionnaire and calculates ratings based on configurable algorithms.

**Architecture**: Serverless application using Cloudflare Pages Functions (backend) + GitHub Pages (frontend static files)

**Tech Stack**:
- Frontend: Vanilla JavaScript with ES6 modules, HTML5, CSS3
- Backend: TypeScript with Cloudflare Pages Functions
- Database: Cloudflare D1 (SQLite)
- Deployment: GitHub Actions

## Build & Development Commands

### Local Development
```bash
# Install dependencies
npm install

# Run local dev server (starts Cloudflare Pages dev environment)
npm run dev

# Access at http://localhost:8788
```

### Database Management
```bash
# Create D1 database (first time only)
wrangler d1 create fund-rating-db

# Apply/update database schema
npm run schema
# or manually:
wrangler d1 execute fund-rating-db --remote --file=schema.sql

# Query database locally
wrangler d1 execute fund-rating-db --local --command="SELECT * FROM counterparty"

# Query database remotely
wrangler d1 execute fund-rating-db --remote --command="SELECT * FROM counterparty"
```

### Deployment
```bash
# Deploy to Cloudflare Pages
npm run deploy

# Deploy manually
wrangler pages deploy frontend --project-name=data-collector
```

### Testing Database Schema Changes
```bash
# Test schema on local database
wrangler d1 execute fund-rating-db --local --file=schema.sql

# If successful, apply to production
wrangler d1 execute fund-rating-db --remote --file=schema.sql
```

## Code Architecture

### Backend (Cloudflare Pages Functions)

**Functions Structure**: Each file in `functions/api/` becomes an API endpoint
- `functions/api/counterparties.ts` → `/api/counterparties`
- `functions/api/stage1/[id].ts` → `/api/stage1/:id` (dynamic route)

**Important Patterns**:

1. **File-based routing**: Cloudflare Pages Functions use file names for routing
   - `[id].ts` = dynamic parameter
   - Must export `onRequestGet`, `onRequestPost`, etc.

2. **Database access**: D1 binding is available via `context.env.DB`
   ```typescript
   const result = await context.env.DB.prepare(
     'SELECT * FROM counterparty WHERE id = ?'
   ).bind(id).run();
   ```

3. **CORS**: All endpoints must return CORS headers (see `functions/utils/db.ts`)

### Frontend Architecture

**Module System**: Uses ES6 modules (`type="module"` in script tags)

**Key Files**:
- `frontend/js/config.js` - API base URL configuration (UPDATE THIS AFTER FIRST DEPLOY)
- `frontend/js/api.js` - API client wrapper
- `frontend/js/app.js` - Common utilities (error handling, session storage)

**State Management**: Uses `sessionStorage` for survey flow
- `current_counterparty_id` - Current survey ID
- `current_counterparty_name` - Display name
- `stage1_route` - Routing result (A or B)

### Database Schema

**Tables**:
1. `counterparty` - Main entity
2. `stage1` - Three yes/no questions + route
3. `stage2_opt1_row` / `stage2_opt2_row` - Dynamic rows for two stage options
4. `stage2_result` - Base rating (1-6)
5. `stage3_answer` - Ten multiple-choice answers
6. `rating_result` - Final rating calculation

**Key Relationships**:
- All tables reference `counterparty.id`
- No cascading deletes (manual cleanup required)
- Latest version only (no history tracking)

## Rating Algorithms

### Stage 1 Routing
```typescript
// functions/utils/calculations.ts:determineRoute()
sum = (q1 ? 1 : 0) + (q2 ? 1 : 0) + (q3 ? 1 : 0)
route = sum >= 2 ? 'A' : 'B'
```

### Stage 2A Base Rating (Option 1)
```typescript
// functions/utils/calculations.ts:calculateStage2ABaseRating()
// Sector scores: Sector 1 = 0.2, Sector 2 = 0.4, Sector 3 = 0.6
weighted_score = Σ(weight * sector_score)
base_rating = clamp(ceil(weighted_score * 6), 1, 6)
```

### Stage 2B Base Rating (Option 2)
```typescript
// functions/utils/calculations.ts:calculateStage2BBaseRating()
// Category factors: 0.8, 1.0, 1.2
// Sector scores: 0.1 to 1.0 (10 sectors)
weighted_score = Σ(weight * category_factor * sector_score)
normalized = weighted_score / 1.2
base_rating = clamp(ceil(normalized * 6), 1, 6)
```

### Stage 3 Final Rating
```typescript
// functions/utils/calculations.ts:calculateFinalRating()
weighted_notch = Σ(question_weight * choice_notch)
final_rating = clamp(round(base_rating + weighted_notch), 1, 6)
```

**Stage 3 Configuration**: `functions/utils/stage3-config.ts`
- 10 questions with varying number of choices (2-10)
- Each choice has a notch value (-3 to +3)
- Question weights sum to 1.0

## Common Development Tasks

### Adding a New API Endpoint

1. Create file in `functions/api/` (e.g., `functions/api/export.ts`)
2. Export HTTP method handlers:
   ```typescript
   import { Env, jsonResponse, errorResponse } from '../utils/db';

   export async function onRequestGet(context: { request: Request; env: Env }) {
     try {
       // Your logic
       return jsonResponse({ data: 'result' });
     } catch (error) {
       return errorResponse(error.message, 500);
     }
   }
   ```

3. Update frontend API client in `frontend/js/api.js`:
   ```javascript
   export const API = {
     // ... existing methods
     newEndpoint: () => fetchAPI('/export'),
   };
   ```

### Modifying Rating Algorithms

1. Edit `functions/utils/calculations.ts`
2. Update constants (SECTOR_SCORES, CATEGORY_FACTORS, etc.)
3. Test locally with `npm run dev`
4. Deploy changes

### Adding Stage 3 Questions

Edit `functions/utils/stage3-config.ts`:
```typescript
export const STAGE3_QUESTIONS: Question[] = [
  {
    no: 1,
    text: 'Your question text',
    weight: 0.1, // Must sum to 1.0 across all questions
    choices: {
      'A': { label: 'Choice A', notch: 2 },
      'B': { label: 'Choice B', notch: -1 },
    },
  },
  // ... more questions
];
```

### Updating Frontend Styling

Edit `frontend/css/styles.css`
- Uses CSS custom properties (variables) for theming
- Main colors defined in `:root`
- Responsive breakpoint at 768px

## Deployment Notes

### First-Time Setup

1. **Create Cloudflare D1 database**:
   ```bash
   wrangler d1 create fund-rating-db
   ```
   Copy the database ID and update `wrangler.toml`

2. **Set GitHub Secrets**:
   - `CF_ACCOUNT_ID` - From Cloudflare dashboard
   - `CF_API_TOKEN` - Create with Pages + D1 permissions

3. **Deploy via GitHub Actions**:
   - Push to `main` branch
   - Actions will deploy to Cloudflare Pages

4. **Update API URL**:
   - After first deployment, note the Cloudflare Pages URL
   - Update `frontend/js/config.js` with the production URL
   - Commit and push again

### Continuous Deployment

- Push to `main` → Auto-deploy to Cloudflare + GitHub Pages
- Schema changes: Automatically applied via workflow
- Function changes: Hot-reloaded by Cloudflare

## Important Gotchas

1. **API URL Configuration**: After first deploy, MUST update `frontend/js/config.js` with actual Cloudflare Pages URL

2. **D1 Binding**: Database binding name in `wrangler.toml` must match usage in code (`DB`)

3. **CORS**: All API endpoints must include CORS headers or frontend will fail

4. **Weight Validation**: Stage 2 weights must sum to 1.0 (tolerance: ±0.01)

5. **Session Storage**: Survey flow relies on sessionStorage - clearing browser data resets progress

6. **SQLite Syntax**: D1 uses SQLite - use `datetime('now')` not `NOW()`, `||` for concatenation

7. **File-based Routing**: Function files must follow Cloudflare Pages naming conventions (`[id].ts` for params)

## Troubleshooting

### "Database not found" error
- Check `wrangler.toml` has correct database_id
- Verify database exists: `wrangler d1 list`

### API calls fail with CORS error
- Ensure all endpoints export `onRequestOptions` handler
- Check `functions/utils/db.ts:corsHeaders()`

### Frontend not connecting to API
- Verify `frontend/js/config.js` API_BASE_URL is correct
- Check browser console for actual URL being called

### Rating calculation seems wrong
- Review `functions/utils/calculations.ts` algorithms
- Check `functions/utils/stage3-config.ts` question weights sum to 1.0
- Test with known inputs using local dev server

### Deployment fails
- Verify GitHub secrets are set correctly
- Check GitHub Actions logs for specific error
- Ensure Cloudflare API token has required permissions
