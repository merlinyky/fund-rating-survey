# Technical Architecture

**Project**: Fund Rating Survey POC
**Stack**: Cloudflare Pages + D1 Database
**Last Updated**: 2025-10-29

---

## System Overview

Serverless web application built on Cloudflare's edge platform:
- **Frontend**: Static HTML/CSS/JavaScript (ES6 modules)
- **Backend**: Cloudflare Pages Functions (TypeScript)
- **Database**: Cloudflare D1 (SQLite at the edge)
- **Deployment**: GitHub Actions → Cloudflare Pages
- **Cost**: $0/month (free tier)

```
┌─────────────┐
│   Browser   │
│  (Client)   │
└──────┬──────┘
       │ HTTPS
       ↓
┌─────────────────────────────┐
│   Cloudflare Pages          │
│  (Static Frontend + API)    │
│  ┌─────────┐  ┌──────────┐ │
│  │  HTML/  │  │ Pages    │ │
│  │  CSS/JS │  │ Functions│ │
│  └─────────┘  └────┬─────┘ │
└────────────────────┼────────┘
                     │ SQL
                     ↓
          ┌──────────────────┐
          │  Cloudflare D1   │
          │  (SQLite Edge)   │
          └──────────────────┘
```

---

## Frontend Architecture

### Technology Stack
- **HTML5**: Semantic markup
- **CSS3**: Custom properties (CSS variables)
- **JavaScript ES6**: Modules, async/await, fetch API
- **No frameworks**: Vanilla JavaScript for simplicity

### File Structure
```
frontend/
├── index.html          # Dashboard (main landing page)
├── register.html       # Counterparty registration form
├── stage1.html         # Stage 1: Yes/No questions
├── stage2a.html        # Stage 2 Route A form
├── stage2b.html        # Stage 2 Route B form
├── stage3.html         # Stage 3: Multiple choice questions
├── review.html         # Survey summary with inline edit
├── edit.html           # Legacy edit page (less used)
├── css/
│   └── styles.css      # Global styles with CSS variables
└── js/
    ├── config.js       # API base URL configuration
    ├── api.js          # API wrapper functions
    └── app.js          # Common utilities
```

### Module Pattern
Each HTML page imports ES6 modules:
```html
<script type="module">
  import { API } from './js/api.js';
  import { showError, showLoading } from './js/app.js';

  // Page-specific code
</script>
```

### State Management
Uses browser `sessionStorage`:
- `current_counterparty_id`: Active survey ID
- `current_counterparty_name`: Display name
- `stage1_route`: Route A or B determination

### API Communication
All API calls go through `api.js` wrapper:
```javascript
// api.js exports
export const API = {
  createCounterparty: (data) => fetchAPI('/counterparties', 'POST', data),
  getDashboard: (search, limit, offset) => fetchAPI('/dashboard?...'),
  submitStage1: (id, answers) => fetchAPI(`/stage1/${id}`, 'POST', answers),
  // ... etc
};
```

### Styling System
CSS custom properties defined in `:root`:
```css
:root {
  --primary-color: #2196F3;
  --success-color: #4CAF50;
  --error-color: #f44336;
  --warning-color: #ff9800;
  /* ... */
}
```

Responsive breakpoint: `768px`
```css
@media (max-width: 768px) {
  /* Mobile styles */
}
```

---

## Backend Architecture

### Technology Stack
- **Runtime**: Cloudflare Workers (V8 JavaScript engine)
- **Language**: TypeScript
- **Routing**: File-based (Cloudflare Pages conventions)
- **Database**: D1 (SQLite with Cloudflare API)

### API Structure
File-based routing in `functions/api/`:
```
functions/
├── api/
│   ├── counterparties.ts       → GET/POST /api/counterparties
│   ├── dashboard.ts            → GET /api/dashboard
│   ├── stage1/[id].ts          → GET/POST /api/stage1/:id
│   ├── stage2/[id].ts          → GET/POST /api/stage2/:id
│   ├── stage3/[id].ts          → GET /api/stage3/:id (GET questions)
│   │                              POST /api/stage3/:id (submit)
│   ├── summary/[id].ts         → GET /api/summary/:id
│   ├── reset-db.ts             → POST /api/reset-db (dev only)
│   └── seed.ts                 → POST /api/seed (dev only)
├── utils/
│   ├── calculations.ts         → Rating algorithms
│   ├── db.ts                   → Database utilities + CORS
│   └── stage3-config.ts        → Question definitions
└── _middleware.ts              → Global middleware
```

### Request Handler Pattern
Each endpoint exports HTTP method handlers:
```typescript
// Example: stage1/[id].ts
export async function onRequestPost(context: {
  request: Request;
  env: Env;
  params: { id: string }
}) {
  // Validate input
  // Process business logic
  // Update database
  // Return JSON response
}

export async function onRequestGet(context) {
  // Fetch data
  // Return JSON
}

export async function onRequestOptions() {
  // CORS preflight
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}
```

### Database Access
D1 binding available via `context.env.DB`:
```typescript
const result = await context.env.DB.prepare(
  'SELECT * FROM counterparty WHERE id = ?'
).bind(id).first();
```

### CORS Configuration
All endpoints return CORS headers:
```typescript
// utils/db.ts
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
```

---

## Database Design

### Database Platform
- **Provider**: Cloudflare D1
- **Engine**: SQLite 3.x
- **Location**: Edge (globally distributed)
- **ID**: `97b44427-e002-4b2e-9f17-c381edf42b01`
- **Region**: ENAM (Eastern North America primary)

### Schema (7 Tables)

#### 1. counterparty
```sql
CREATE TABLE counterparty (
  id TEXT PRIMARY KEY,
  cp_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```
- `id`: System-generated (CP{timestamp}{random})
- `cp_id`: User-provided unique identifier
- `name`: Counterparty display name

#### 2. stage1
```sql
CREATE TABLE stage1 (
  counterparty_id TEXT PRIMARY KEY,
  q1 INTEGER NOT NULL CHECK(q1 IN (0,1)),
  q2 INTEGER NOT NULL CHECK(q2 IN (0,1)),
  q3 INTEGER NOT NULL CHECK(q3 IN (0,1)),
  route TEXT NOT NULL CHECK(route IN ('A','B')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```
- Stores 3 boolean questions (0/1)
- `route`: Calculated from question answers

#### 3. stage2_opt1_row (Route A)
```sql
CREATE TABLE stage2_opt1_row (
  counterparty_id TEXT NOT NULL,
  line_no INTEGER NOT NULL,
  underline TEXT NOT NULL,
  sector TEXT NOT NULL,
  weight REAL NOT NULL CHECK(weight >= 0 AND weight <= 1),
  PRIMARY KEY (counterparty_id, line_no)
);
```

#### 4. stage2_opt2_row (Route B)
```sql
CREATE TABLE stage2_opt2_row (
  counterparty_id TEXT NOT NULL,
  line_no INTEGER NOT NULL,
  category TEXT NOT NULL,
  sector TEXT NOT NULL,
  weight REAL NOT NULL CHECK(weight >= 0 AND weight <= 1),
  PRIMARY KEY (counterparty_id, line_no)
);
```

#### 5. stage2_result
```sql
CREATE TABLE stage2_result (
  counterparty_id TEXT PRIMARY KEY,
  option INTEGER NOT NULL CHECK(option IN (1,2)),
  base_rating INTEGER NOT NULL CHECK(base_rating >= 1 AND base_rating <= 6),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```
- `option`: 1=Route A, 2=Route B
- `base_rating`: Calculated rating (1-6)

#### 6. stage3_answer
```sql
CREATE TABLE stage3_answer (
  counterparty_id TEXT NOT NULL,
  question_no INTEGER NOT NULL CHECK(question_no >= 1 AND question_no <= 10),
  choice_key TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (counterparty_id, question_no)
);
```
- Stores user's choice for each of 10 questions
- `choice_key`: Letter choice (A, B, C, etc.)

#### 7. rating_result
```sql
CREATE TABLE rating_result (
  counterparty_id TEXT PRIMARY KEY,
  base_rating INTEGER NOT NULL,
  weighted_notch REAL NOT NULL,
  final_rating INTEGER NOT NULL CHECK(final_rating >= 1 AND final_rating <= 6),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```
- `weighted_notch`: Calculated from Stage 3 answers
- `final_rating`: base_rating + weighted_notch (clamped)

### Database Relationships
```
counterparty (1)
  ├── stage1 (0..1)
  ├── stage2_opt1_row (0..N)
  ├── stage2_opt2_row (0..N)
  ├── stage2_result (0..1)
  ├── stage3_answer (0..10)
  └── rating_result (0..1)
```

**Note**: No foreign key constraints or cascading deletes. Manual cleanup required.

### Indexes
Currently none beyond primary keys. Consider adding for production:
```sql
CREATE INDEX idx_counterparty_cp_id ON counterparty(cp_id);
CREATE INDEX idx_counterparty_created ON counterparty(created_at DESC);
```

---

## Rating Calculation Algorithms

### Stage 1: Route Determination
**Location**: `functions/utils/calculations.ts:determineRoute()`

```typescript
function determineRoute(q1: boolean, q2: boolean, q3: boolean): 'A' | 'B' {
  const sum = (q1 ? 1 : 0) + (q2 ? 1 : 0) + (q3 ? 1 : 0);
  return sum >= 2 ? 'A' : 'B';
}
```

**Logic**: Count "yes" answers. If ≥2, Route A; otherwise Route B.

### Stage 2A: Base Rating (Route A)
**Location**: `functions/utils/calculations.ts:calculateStage2ABaseRating()`

```typescript
const SECTOR_SCORES_A = {
  'Sector 1': 0.2,
  'Sector 2': 0.4,
  'Sector 3': 0.6,
};

function calculateStage2ABaseRating(rows: Row[]): number {
  let weightedScore = 0;
  for (const row of rows) {
    const sectorScore = SECTOR_SCORES_A[row.sector];
    weightedScore += row.weight * sectorScore;
  }
  const rating = Math.ceil(weightedScore * 6);
  return Math.max(1, Math.min(6, rating));
}
```

**Example**:
- Row 1: Sector 3 (0.6), Weight 0.7 → 0.6 × 0.7 = 0.42
- Row 2: Sector 1 (0.2), Weight 0.3 → 0.2 × 0.3 = 0.06
- Weighted Score = 0.48
- Rating = CEIL(0.48 × 6) = CEIL(2.88) = 3

### Stage 2B: Base Rating (Route B)
**Location**: `functions/utils/calculations.ts:calculateStage2BBaseRating()`

```typescript
const CATEGORY_FACTORS = {
  'Category 1': 0.8,
  'Category 2': 1.0,
  'Category 3': 1.2,
};

const SECTOR_SCORES_B = {
  'Sector 1': 0.1,
  'Sector 2': 0.2,
  // ... up to
  'Sector 10': 1.0,
};

function calculateStage2BBaseRating(rows: Row[]): number {
  let weightedScore = 0;
  for (const row of rows) {
    const categoryFactor = CATEGORY_FACTORS[row.category];
    const sectorScore = SECTOR_SCORES_B[row.sector];
    weightedScore += row.weight * categoryFactor * sectorScore;
  }
  const normalized = weightedScore / 1.2;
  const rating = Math.ceil(normalized * 6);
  return Math.max(1, Math.min(6, rating));
}
```

### Stage 3: Final Rating
**Location**: `functions/utils/calculations.ts:calculateFinalRating()`

```typescript
// Question config from stage3-config.ts
const STAGE3_QUESTIONS = [
  {
    no: 1,
    weight: 0.15,
    choices: {
      'A': { notch: -2 },
      'B': { notch: 0 },
      'C': { notch: 2 },
    }
  },
  // ... 9 more questions
];

function calculateFinalRating(
  baseRating: number,
  answers: Answer[]
): { weighted_notch: number; final_rating: number } {
  let weightedNotch = 0;

  for (const answer of answers) {
    const question = STAGE3_QUESTIONS.find(q => q.no === answer.question_no);
    const choice = question.choices[answer.choice_key];
    weightedNotch += question.weight * choice.notch;
  }

  const finalRating = Math.round(baseRating + weightedNotch);
  return {
    weighted_notch: weightedNotch,
    final_rating: Math.max(1, Math.min(6, finalRating)),
  };
}
```

**Example**:
- Base Rating: 3
- Question 1 (weight 0.15): Answer B (notch 0) → 0.15 × 0 = 0
- Question 2 (weight 0.10): Answer A (notch -2) → 0.10 × -2 = -0.2
- ... (8 more questions)
- Weighted Notch: -0.5
- Final Rating: ROUND(3 + (-0.5)) = ROUND(2.5) = 3

### Auto-Recalculation Logic
**Location**: `functions/api/stage2/[id].ts:99-121`

When Stage 2 is updated:
1. Calculate new base rating
2. Check if Stage 3 answers exist
3. If yes, recalculate final rating using existing Stage 3 answers
4. Update `rating_result` table

```typescript
// After updating stage2_result...
const stage3Answers = await DB.prepare(
  'SELECT question_no, choice_key FROM stage3_answer WHERE counterparty_id = ?'
).bind(counterpartyId).all();

if (stage3Answers.results && stage3Answers.results.length > 0) {
  const { weighted_notch, final_rating } = calculateFinalRating(
    newBaseRating,
    stage3Answers.results
  );

  await DB.prepare(
    'INSERT INTO rating_result (...) VALUES (...) ON CONFLICT(...) DO UPDATE ...'
  ).bind(counterpartyId, newBaseRating, weighted_notch, final_rating).run();
}
```

---

## Deployment Architecture

### CI/CD Pipeline
GitHub Actions workflow (`.github/workflows/deploy.yml`):

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js 18
      - Install dependencies
      - Install Wrangler CLI
      - Apply D1 schema (continues on error)
      - Deploy to Cloudflare Pages
```

### Environment Configuration

**wrangler.toml**:
```toml
name = "data-collector-api"
compatibility_date = "2024-06-20"
pages_build_output_dir = "frontend"

[[d1_databases]]
binding = "DB"
database_name = "fund-rating-db"
database_id = "97b44427-e002-4b2e-9f17-c381edf42b01"
```

**frontend/js/config.js**:
```javascript
const isLocal = window.location.hostname === 'localhost'
  || window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isLocal
  ? 'http://localhost:8788/api'
  : 'https://fund-rating-survey.pages.dev/api';
```

### Deployment Process

1. **Develop locally**:
   ```bash
   npm run dev
   # Runs: wrangler pages dev frontend --binding DB=fund-rating-db
   # Access: http://localhost:8788
   ```

2. **Commit changes**:
   ```bash
   git add .
   git commit -m "Description"
   git push origin main
   ```

3. **Automatic deployment**:
   - GitHub Actions triggered
   - D1 schema applied (if changed)
   - Frontend + Functions deployed to Cloudflare Pages
   - Live in ~2 minutes

4. **Manual deployment** (if needed):
   ```bash
   npx wrangler pages deploy frontend --project-name=fund-rating-survey
   ```

### Production URLs
- **Application**: https://fund-rating-survey.pages.dev/
- **Cloudflare Dashboard**: https://dash.cloudflare.com/

### GitHub Secrets
Required for CI/CD:
- `CF_ACCOUNT_ID`: f78ef49b741c2147bc71901d7b62a4a7
- `CF_API_TOKEN`: ci2PkBiP7i0a3VrlpM7hV_lPfQSBpZc7v5oB6jHj

---

## Development Workflow

### Local Setup
```bash
# 1. Clone repository
git clone https://github.com/merlinyky/fund-rating-survey.git
cd fund-rating-survey

# 2. Install dependencies
npm install

# 3. Initialize local database
npm run reset-db

# 4. Start dev server
npm run dev

# 5. Access application
open http://localhost:8788
```

### Common Development Tasks

**Reset database**:
```bash
npm run reset-db
# Removes .wrangler/state, applies schema, seeds test data
```

**Apply schema only**:
```bash
npm run schema
# Applies schema.sql to remote database
```

**Query local database**:
```bash
npx wrangler d1 execute fund-rating-db --local --command="SELECT * FROM counterparty"
```

**Query production database**:
```bash
npx wrangler d1 execute fund-rating-db --remote --command="SELECT * FROM counterparty"
```

**Add new API endpoint**:
1. Create `functions/api/newroute.ts`
2. Export `onRequestGet`, `onRequestPost`, etc.
3. Export `onRequestOptions` for CORS
4. Add function to `frontend/js/api.js`

**Modify rating algorithm**:
1. Edit `functions/utils/calculations.ts`
2. Update constants or formulas
3. Test locally
4. Push to deploy

**Add/modify Stage 3 questions**:
1. Edit `functions/utils/stage3-config.ts`
2. Adjust weights (must sum to 1.0)
3. Update notch values
4. Deploy

---

## Performance Optimization

### Cloudflare Edge Network
- Static assets cached at edge locations globally
- D1 database replicated to multiple regions
- API responses served from nearest edge location

### Database Query Optimization
- Use prepared statements with parameter binding
- Avoid N+1 queries (join tables in single query)
- Add indexes for frequently searched columns

### Frontend Performance
- Minimal JavaScript (no heavy frameworks)
- CSS minification in production
- Browser caching for static assets

### Monitoring
- View logs: Cloudflare Dashboard → Workers & Pages → Logs
- Database metrics: Cloudflare Dashboard → D1 → Analytics

---

## Security Considerations

### Current Security Posture
- ⚠️ **No authentication** - All endpoints public
- ⚠️ **No rate limiting** - Potential for abuse
- ✅ **HTTPS only** - All traffic encrypted
- ✅ **CORS configured** - Prevents unauthorized cross-origin requests
- ✅ **SQL injection protected** - Parameterized queries only
- ✅ **Input validation** - Server-side validation for all inputs

### Recommendations for Production
1. Add authentication (OAuth, JWT)
2. Implement rate limiting (Cloudflare Workers API)
3. Add CSRF protection
4. Implement audit logging
5. Add data encryption at rest
6. Configure WAF rules

---

## Troubleshooting

### Issue: API returns empty data
**Symptom**: Dashboard shows no counterparties even though database has data
**Cause**: Database binding incorrect
**Fix**: Ensure dev command uses `--binding DB=fund-rating-db`

### Issue: CORS errors in browser console
**Symptom**: "Access-Control-Allow-Origin" error
**Cause**: Missing CORS headers or OPTIONS handler
**Fix**: Export `onRequestOptions` in all API endpoints

### Issue: Weight validation fails unexpectedly
**Symptom**: Valid weights (sum=1.0) rejected
**Cause**: Floating-point precision
**Fix**: Use tolerance check `Math.abs(sum - 1.0) <= 0.01`

### Issue: Session lost between pages
**Symptom**: Survey progress lost when navigating
**Cause**: sessionStorage cleared or different domain
**Fix**: Check browser settings, ensure same origin

### Issue: Final rating not updating after Stage 2 edit
**Symptom**: Base rating changes but final rating stays same
**Cause**: Auto-recalc logic not triggered
**Fix**: Check `functions/api/stage2/[id].ts` lines 99-121

---

## Technology Choices Rationale

### Why Cloudflare Pages?
- ✅ Free tier generous (unlimited requests)
- ✅ Global edge network (low latency)
- ✅ Built-in CI/CD with GitHub
- ✅ Serverless (no infrastructure management)
- ✅ D1 database included

### Why D1 (SQLite)?
- ✅ Familiar SQL syntax
- ✅ ACID transactions
- ✅ No connection pooling needed
- ✅ Edge replication built-in
- ✅ Free tier: 100k reads/day, 50k writes/day

### Why TypeScript?
- ✅ Type safety catches errors early
- ✅ Better IDE autocomplete
- ✅ Self-documenting code
- ✅ Compiles to JavaScript (no runtime overhead)

### Why Vanilla JavaScript (no framework)?
- ✅ Faster page loads (no bundle)
- ✅ No build step for frontend
- ✅ Easier to understand for POC
- ✅ No framework lock-in

---

**Document Owner**: Engineering
**Last Review**: 2025-10-29
**Status**: Current ✅
