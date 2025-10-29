# Implementation Plan: Fund Rating Survey POC

## Executive Summary

This plan outlines the step-by-step implementation of a multi-stage survey system for rating counterparty funds. The system uses GitHub Pages for frontend hosting and Cloudflare Pages Functions with D1 (SQLite) for backend API and data storage.

## Tech Stack

- **Frontend**: Static HTML/CSS/JavaScript (vanilla or lightweight framework)
- **Backend**: Cloudflare Pages Functions (TypeScript)
- **Database**: Cloudflare D1 (SQLite)
- **Hosting**: GitHub Pages (frontend) + Cloudflare Pages (backend/API)
- **Deployment**: GitHub Actions with Cloudflare API integration

---

## Phase 1: Project Setup & Infrastructure

### 1.1 Initialize Repository Structure
```
data_collector/
├── frontend/                    # GitHub Pages static site
│   ├── index.html              # Dashboard/home page
│   ├── register.html           # Counterparty registration
│   ├── stage1.html             # Stage 1 questions
│   ├── stage2a.html            # Stage 2 Option 1
│   ├── stage2b.html            # Stage 2 Option 2
│   ├── stage3.html             # Stage 3 questions
│   ├── review.html             # Review/edit page
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── api.js              # API client wrapper
│       ├── app.js              # Main application logic
│       └── config.js           # API endpoint configuration
├── functions/                   # Cloudflare Pages Functions
│   └── api/
│       ├── counterparties.ts
│       ├── stage1.ts
│       ├── stage2.ts
│       ├── stage3.ts
│       ├── summary.ts
│       └── dashboard.ts
├── schema.sql                   # D1 database schema
├── wrangler.toml               # Cloudflare configuration
├── package.json
├── tsconfig.json
└── .github/
    └── workflows/
        └── deploy.yml          # CI/CD pipeline
```

### 1.2 Cloudflare D1 Database Setup
- Create D1 database via Cloudflare dashboard or Wrangler CLI
- Note the database ID for `wrangler.toml`
- Initialize schema with tables (see Phase 2)

### 1.3 Configure GitHub Secrets
Add the following secrets to repository settings:
- `CF_ACCOUNT_ID`: Cloudflare account ID
- `CF_API_TOKEN`: Cloudflare API token with Pages and D1 permissions

---

## Phase 2: Database Schema Implementation

### 2.1 Core Tables
Implement `schema.sql` with the following tables:

1. **app_user**: User authentication (optional for POC, can be simplified)
2. **counterparty**: Fund/counterparty registry
3. **stage1**: Stage 1 question answers and routing
4. **stage2_opt1_row**: Stage 2A dynamic rows (Underline + Sector + Weight)
5. **stage2_opt2_row**: Stage 2B dynamic rows (Category + Sector + Weight)
6. **stage2_result**: Base rating from Stage 2
7. **stage3_answer**: Stage 3 multiple choice answers
8. **rating_result**: Final computed rating

### 2.2 Schema Considerations
- Use TEXT for timestamps (ISO 8601 format)
- Add CHECK constraints for data validation
- Create indexes on frequently queried fields (counterparty name, ID)
- Ensure foreign key relationships are logical

---

## Phase 3: Backend API Development

### 3.1 Common Utilities
Create shared utilities in `functions/utils/`:
- Database connection helper
- Response formatting (JSON, errors)
- Input validation
- CORS headers configuration

### 3.2 API Endpoints

#### `/api/counterparties` (POST)
- **Purpose**: Register new counterparty
- **Input**: `{ name: string }`
- **Output**: `{ id: string, name: string }`
- **Logic**: Generate unique ID, insert into `counterparty` table

#### `/api/counterparties` (GET)
- **Purpose**: Search/list counterparties
- **Query params**: `?search=<name>&limit=50&offset=0`
- **Output**: Array of counterparties with basic info

#### `/api/stage1/:id` (POST)
- **Purpose**: Submit Stage 1 answers and compute route
- **Input**: `{ q1: boolean, q2: boolean, q3: boolean }`
- **Output**: `{ route: "A" | "B" }`
- **Logic**:
  ```javascript
  sum = (q1 ? 1 : 0) + (q2 ? 1 : 0) + (q3 ? 1 : 0)
  route = sum >= 2 ? 'A' : 'B'
  ```
- **Database**: Insert/update `stage1` table

#### `/api/stage2/:id` (POST)
- **Purpose**: Submit Stage 2 data and compute base rating
- **Input**:
  ```json
  {
    "option": 1 | 2,
    "rows": [
      { "underline": "...", "sector": "...", "weight": 0.5 },
      ...
    ]
  }
  ```
- **Validation**: Weights must sum to 1.0 (±0.01 tolerance)
- **Output**: `{ base_rating: 1-6 }`
- **Logic**: See algorithms below
- **Database**:
  - Clear existing rows for this counterparty
  - Insert new rows into `stage2_opt1_row` or `stage2_opt2_row`
  - Insert/update `stage2_result`

#### `/api/stage3/:id` (POST)
- **Purpose**: Submit Stage 3 answers and compute final rating
- **Input**:
  ```json
  {
    "answers": [
      { "question_no": 1, "choice_key": "A" },
      ...
    ]
  }
  ```
- **Output**:
  ```json
  {
    "base_rating": 4,
    "weighted_notch": 1.2,
    "final_rating": 5
  }
  ```
- **Logic**: See Stage 3 algorithm below
- **Database**:
  - Insert/update `stage3_answer` (10 rows)
  - Insert/update `rating_result`

#### `/api/summary/:id` (GET)
- **Purpose**: Fetch complete survey data for review
- **Output**: All stages' data, ratings, and final result
- **Database**: Join queries across all tables

#### `/api/dashboard` (GET)
- **Purpose**: Dashboard listing with search
- **Query params**: `?search=<name>&limit=50&offset=0`
- **Output**: Paginated list with counterparty info and ratings

---

## Phase 4: Rating Algorithms Implementation

### 4.1 Stage 2A Base Rating (Option 1)
```typescript
const SECTOR_SCORES = {
  'Sector 1': 0.2,
  'Sector 2': 0.4,
  'Sector 3': 0.6
};

function calculateStage2ABaseRating(rows: Array<{sector: string, weight: number}>): number {
  const score = rows.reduce((sum, row) => {
    return sum + (row.weight * (SECTOR_SCORES[row.sector] || 0));
  }, 0);

  const baseRating = Math.ceil(score * 6);
  return Math.max(1, Math.min(6, baseRating)); // Clamp to 1-6
}
```

### 4.2 Stage 2B Base Rating (Option 2)
```typescript
const CATEGORY_FACTORS = {
  'Category 1': 0.8,
  'Category 2': 1.0,
  'Category 3': 1.2
};

const SECTOR_SCORES_2B = {
  'Sector 1': 0.1,
  'Sector 2': 0.2,
  'Sector 3': 0.3,
  'Sector 4': 0.4,
  'Sector 5': 0.5,
  'Sector 6': 0.6,
  'Sector 7': 0.7,
  'Sector 8': 0.8,
  'Sector 9': 0.9,
  'Sector 10': 1.0
};

function calculateStage2BBaseRating(rows: Array<{category: string, sector: string, weight: number}>): number {
  const score = rows.reduce((sum, row) => {
    const categoryFactor = CATEGORY_FACTORS[row.category] || 1.0;
    const sectorScore = SECTOR_SCORES_2B[row.sector] || 0;
    return sum + (row.weight * categoryFactor * sectorScore);
  }, 0);

  const normalized = score / 1.2;
  const baseRating = Math.ceil(normalized * 6);
  return Math.max(1, Math.min(6, baseRating));
}
```

### 4.3 Stage 3 Final Rating
```typescript
// Configuration: 10 questions with weights
const STAGE3_CONFIG = {
  questions: [
    {
      no: 1,
      weight: 0.15,
      choices: {
        'A': { label: 'Choice A', notch: 2 },
        'B': { label: 'Choice B', notch: 0 },
        'C': { label: 'Choice C', notch: -1 }
      }
    },
    // ... 9 more questions
  ]
};

function calculateFinalRating(
  baseRating: number,
  answers: Array<{question_no: number, choice_key: string}>
): { weighted_notch: number, final_rating: number } {

  const weightedNotch = answers.reduce((sum, answer) => {
    const question = STAGE3_CONFIG.questions.find(q => q.no === answer.question_no);
    if (!question) return sum;

    const choice = question.choices[answer.choice_key];
    if (!choice) return sum;

    return sum + (question.weight * choice.notch);
  }, 0);

  const finalRating = Math.round(baseRating + weightedNotch);
  const clampedRating = Math.max(1, Math.min(6, finalRating));

  return {
    weighted_notch: weightedNotch,
    final_rating: clampedRating
  };
}
```

---

## Phase 5: Frontend Development

### 5.1 Registration Page (`register.html`)
- Simple form: Counterparty name input
- Submit → POST `/api/counterparties`
- Store counterparty ID in sessionStorage
- Redirect to Stage 1

### 5.2 Stage 1 Page (`stage1.html`)
- Display 3 yes/no questions
- Submit → POST `/api/stage1/:id`
- Receive route (A or B)
- Redirect to `stage2a.html` or `stage2b.html`

### 5.3 Stage 2A Page (`stage2a.html`)
- Dynamic row management:
  - Add/remove row buttons
  - Text input: Underline
  - Dropdown: Sector (Sector 1, 2, 3)
  - Number input: Weight
- Real-time validation: Sum of weights = 1.0
- Submit → POST `/api/stage2/:id` with option=1
- Display base rating result
- Proceed to Stage 3

### 5.4 Stage 2B Page (`stage2b.html`)
- Similar to 2A but different fields:
  - Dropdown: Category (1, 2, 3)
  - Dropdown: Sector (1-10)
  - Number input: Weight
- Submit → POST `/api/stage2/:id` with option=2

### 5.5 Stage 3 Page (`stage3.html`)
- Display 10 multiple-choice questions
- Each question: 2-6 radio button choices
- Submit → POST `/api/stage3/:id`
- Display final rating result
- Button to return to dashboard

### 5.6 Dashboard (`index.html`)
- Search bar for counterparty name/ID
- Table view:
  - Counterparty ID | Name | Base Rating | Final Rating | Actions
- Actions: View details, Edit/recalculate
- Pagination controls

### 5.7 Review Page (`review.html`)
- Display all stages' answers
- Editable forms for each stage
- Recalculate button → resubmit to respective APIs
- Show updated ratings

---

## Phase 6: Deployment Automation

### 6.1 Wrangler Configuration (`wrangler.toml`)
```toml
name = "data-collector-api"
compatibility_date = "2024-06-20"
pages_build_output_dir = "frontend"

[[d1_databases]]
binding = "DB"
database_name = "fund-rating-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

### 6.2 GitHub Actions Workflow (`.github/workflows/deploy.yml`)
```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Wrangler
        run: npm install -g wrangler

      - name: Apply D1 Schema
        run: |
          wrangler d1 execute fund-rating-db --remote --file=schema.sql
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}

      - name: Deploy to Cloudflare Pages
        run: wrangler pages deploy frontend --project-name=data-collector
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend
```

---

## Phase 7: Testing & Validation

### 7.1 Unit Tests
- Test rating calculation algorithms with known inputs/outputs
- Test weight validation (sum = 1.0)
- Test routing logic (Stage 1)

### 7.2 Integration Tests
- Test full survey flow end-to-end
- Test database CRUD operations
- Test API error handling

### 7.3 Manual Testing Checklist
- [ ] Register new counterparty
- [ ] Complete Stage 1 with different answer combinations
- [ ] Verify routing to correct Stage 2 option
- [ ] Add/remove dynamic rows in Stage 2
- [ ] Submit invalid weights (should fail)
- [ ] Complete Stage 3 and verify final rating
- [ ] Search for counterparty in dashboard
- [ ] Edit existing survey and recalculate rating
- [ ] Test on mobile devices

---

## Implementation Order

### Week 1: Foundation
1. Set up repository structure
2. Initialize Cloudflare D1 database
3. Implement database schema
4. Configure GitHub Actions workflow
5. Create basic wrangler.toml

### Week 2: Backend Core
1. Implement `/api/counterparties` endpoints
2. Implement `/api/stage1/:id`
3. Implement `/api/stage2/:id` with both options
4. Implement rating calculation algorithms
5. Add input validation and error handling

### Week 3: Backend Completion & Frontend Start
1. Implement `/api/stage3/:id`
2. Implement `/api/summary/:id` and `/api/dashboard`
3. Create registration page
4. Create Stage 1 page

### Week 4: Frontend Completion
1. Create Stage 2A and 2B pages with dynamic rows
2. Create Stage 3 page with question configuration
3. Create dashboard page with search
4. Create review/edit page

### Week 5: Polish & Deploy
1. Add CSS styling
2. Test full workflow
3. Deploy to Cloudflare + GitHub Pages
4. Fix bugs and refine UX
5. Document deployment process

---

## Key Design Decisions & Rationale

### Why Cloudflare Pages Functions?
- Serverless, no infrastructure management
- Free tier is generous for POC
- D1 database integrated natively
- GitHub integration for automated deploys

### Why Separate Stage 2 Tables?
- Option 1 and Option 2 have different column schemas
- Keeps data normalized and type-safe
- Easier to query and validate

### Why Not Use a Frontend Framework?
- POC requires quick deployment
- Vanilla JS reduces build complexity
- GitHub Pages hosts static files directly
- Can upgrade to React/Vue later if needed

### Configuration vs. Hard-coding
- Stage 3 questions/weights can be configured in a JSON file or database table
- For POC, hard-coding in backend is acceptable
- Future: Move to admin UI for question management

---

## Future Enhancements (Out of Scope for POC)

- User authentication and authorization
- Admin panel for managing questions/weights
- Export ratings to CSV/Excel
- Audit log for all changes
- Multi-language support
- Advanced search filters
- Bulk import counterparties
- Email notifications for completed surveys
- API rate limiting and security headers

---

## Risk Mitigation

### Risk: Cloudflare D1 database limits
**Mitigation**: Monitor usage, D1 free tier supports 100k reads/day

### Risk: GitHub Pages deployment conflicts
**Mitigation**: Use separate Cloudflare project for API, keep frontend static

### Risk: Complex dynamic row validation
**Mitigation**: Implement real-time validation on frontend + backend double-check

### Risk: Rating algorithm changes
**Mitigation**: Version control algorithms, document changes, allow recalculation

---

## Success Criteria

- [ ] User can register counterparty and complete all 3 stages
- [ ] Ratings are calculated correctly per algorithms
- [ ] Dashboard displays all counterparties with search
- [ ] Edit functionality allows recalculation
- [ ] Fully deployed via GitHub Actions
- [ ] No manual infrastructure setup required
- [ ] Documentation complete for future developers

---

## Questions to Resolve Before Implementation

1. **Stage 3 Question Content**: Do you have the actual 10 questions and their choices ready, or should we use placeholder text?
2. **Authentication**: Should users need to log in, or is it open access for POC?
3. **Data Persistence**: Is the POC data temporary, or should we plan for long-term storage?
4. **Design/Styling**: Any specific UI requirements, or simple clean design acceptable?
5. **Domain**: Will this be on a custom domain or default GitHub/Cloudflare URLs?
