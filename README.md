# Fund Rating Survey - POC

A multi-stage survey system for rating counterparty funds with intelligent routing and configurable algorithms.

**Live Demo**: https://fund-rating-survey.pages.dev/

---

## Quick Overview

Serverless web application that collects portfolio information through a 3-stage questionnaire and calculates risk ratings (1-6 scale, where 1 is best).

**Technology Stack**:
- Frontend: Vanilla JavaScript (ES6 modules), HTML5, CSS3
- Backend: Cloudflare Pages Functions (TypeScript)
- Database: Cloudflare D1 (SQLite)
- Deployment: GitHub Actions → Cloudflare Pages
- Cost: $0/month (free tier)

---

## Features

### Multi-Stage Workflow
1. **Stage 1** - 3 yes/no questions determine Route A or B
2. **Stage 2** - Portfolio data entry (different forms per route)
3. **Stage 3** - 10 risk assessment questions
4. **Final Rating** - Calculated rating with breakdown

### Key Capabilities
- ✅ Intelligent routing based on initial answers
- ✅ Dynamic form rows with weight validation
- ✅ Auto-recalculation when editing Stage 2
- ✅ Dashboard with search and filtering
- ✅ Inline editing from review page
- ✅ Color-coded weighted notch display
- ✅ Session-based workflow

---

## Quick Start

### Prerequisites
- Node.js 18+
- Cloudflare account (optional, for deployment)

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Initialize local database
npm run reset-db

# 3. Start development server
npm run dev

# 4. Open in browser
open http://localhost:8788
```

### Available Commands

```bash
npm run dev         # Start local dev server
npm run reset-db    # Reset local database with test data
npm run schema      # Apply schema to production database
npm run seed        # Seed test data to local database
```

---

## Usage

### Creating a Survey

1. **Register Counterparty**
   - Navigate to: http://localhost:8788/register.html
   - Enter CP ID and Name
   - Click "Register Counterparty"

2. **Complete Stage 1**
   - Answer 3 yes/no questions
   - System automatically determines Route A or B

3. **Complete Stage 2**
   - Add rows for portfolio allocation
   - Ensure weights sum to 1.0
   - Submit to calculate base rating

4. **Complete Stage 3**
   - Answer 10 multiple-choice questions
   - Submit to calculate final rating

5. **View Results**
   - Dashboard shows all counterparties
   - Click "View" to see detailed breakdown
   - Edit any stage using inline "Edit" buttons

---

## Project Structure

```
.
├── frontend/                # Static frontend files
│   ├── css/styles.css      # Global styles
│   ├── js/                 # JavaScript modules
│   └── *.html              # Page templates
├── functions/              # Cloudflare Pages Functions
│   ├── api/                # API endpoints
│   └── utils/              # Business logic
├── schema.sql              # Database schema
├── wrangler.toml           # Cloudflare configuration
├── package.json            # Dependencies & scripts
├── README.md               # This file - Project overview
├── REQUIREMENTS.md         # Business requirements
├── ARCHITECTURE.md         # Technical documentation
├── CHANGELOG.md            # Change history
└── CLAUDE.md               # AI assistant guide
```

---

## Documentation

### For Users
- **README.md** (this file) - Project overview and quick start

### For Developers
- **[REQUIREMENTS.md](REQUIREMENTS.md)** - Business requirements and acceptance criteria
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture and implementation details
- **[CHANGELOG.md](CHANGELOG.md)** - Project history and decisions

### For AI Assistants
- **[CLAUDE.md](CLAUDE.md)** - Developer guide with documentation registry

---

## Rating System

### Scale
- **1** = Best (lowest risk)
- **6** = Worst (highest risk)

### Calculation
```
Stage 1: Routing Logic
  → sum of "yes" answers ≥ 2 = Route A
  → sum of "yes" answers < 2 = Route B

Stage 2: Base Rating (1-6)
  → Route A: Σ(weight × sector_score) × 6
  → Route B: Σ(weight × category_factor × sector_score) / 1.2 × 6

Stage 3: Final Rating (1-6)
  → weighted_notch = Σ(question_weight × choice_notch)
  → final_rating = CLAMP(ROUND(base_rating + weighted_notch), 1, 6)
```

---

## Production Deployment

The application is deployed to Cloudflare Pages with automated CI/CD via GitHub Actions.

**Live URL**: https://fund-rating-survey.pages.dev/

### Deployment Process
1. Push to `main` branch
2. GitHub Actions automatically deploys
3. Live in ~2 minutes

For detailed deployment instructions, see [ARCHITECTURE.md - Deployment](ARCHITECTURE.md#deployment-architecture).

---

## Development Workflow

### Making Changes
```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes and test locally
npm run dev

# 3. Commit and push
git add .
git commit -m "Description of changes"
git push origin feature/my-feature

# 4. Create pull request on GitHub
# 5. Merge to main → Auto-deploys to production
```

### Testing
```bash
# Test API endpoint
curl http://localhost:8788/api/counterparties

# Query local database
npx wrangler d1 execute fund-rating-db --local --command="SELECT * FROM counterparty"

# Query production database
npx wrangler d1 execute fund-rating-db --remote --command="SELECT * FROM counterparty"
```

---

## Common Tasks

### Modify Rating Algorithms
Edit `functions/utils/calculations.ts`:
- `calculateStage2ABaseRating()` - Route A calculation
- `calculateStage2BBaseRating()` - Route B calculation
- `calculateFinalRating()` - Final rating with notch

### Add/Change Stage 3 Questions
Edit `functions/utils/stage3-config.ts`:
- 10 questions with configurable weights and notch values
- Weights must sum to 1.0

### Update Styling
Edit `frontend/css/styles.css`:
- Uses CSS custom properties (variables)
- Mobile-first responsive design (breakpoint: 768px)

### Add New API Endpoint
1. Create file in `functions/api/`
2. Export HTTP method handlers (`onRequestGet`, `onRequestPost`, etc.)
3. Add CORS handler (`onRequestOptions`)
4. Update `frontend/js/api.js`

---

## Troubleshooting

### API Returns Empty Data
**Problem**: Dashboard shows no counterparties
**Solution**: Restart dev server with `npm run dev`

### CORS Errors
**Problem**: Browser shows "Access-Control-Allow-Origin" error
**Solution**: Ensure all API endpoints export `onRequestOptions` handler

### Weight Validation Fails
**Problem**: Valid weights (sum=1.0) rejected
**Solution**: Floating-point precision issue - tolerance is ±0.01

### Session Lost
**Problem**: Survey progress lost when navigating
**Solution**: Don't open in multiple tabs, sessionStorage is tab-specific

---

## Contributing

### Before You Start
1. Read [REQUIREMENTS.md](REQUIREMENTS.md) for business context
2. Read [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
3. Check [CHANGELOG.md](CHANGELOG.md) for recent changes

### Development Guidelines
- Write clear commit messages
- Test locally before pushing
- Update documentation for significant changes
- Follow existing code patterns

---

## Support

- **Issues**: https://github.com/merlinyky/fund-rating-survey/issues
- **Cloudflare Docs**: https://developers.cloudflare.com/pages/
- **D1 Database Docs**: https://developers.cloudflare.com/d1/

---

## License

MIT

---

**Status**: ✅ Production Deployed
**Last Updated**: 2025-10-29
**Maintained By**: Engineering Team
