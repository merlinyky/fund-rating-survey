# Claude Code Developer Guide

**Purpose**: This file provides guidance to AI assistants (Claude Code) when working with this repository.

**Last Updated**: 2025-10-29
**Status**: ✅ Production Deployed

---

## 📚 Documentation Registry

### Current Documentation Files (5 files)

This project maintains **exactly 5 markdown files**. Each has a specific purpose:

| File | Purpose | Audience | Content |
|------|---------|----------|---------|
| **README.md** | Project overview, quick start guide | Users, new developers | Features, installation, usage examples |
| **REQUIREMENTS.md** | Business requirements, feature specs | Product, QA, Developers | User stories, acceptance criteria, business rules |
| **ARCHITECTURE.md** | Technical implementation details | Developers, DevOps | System design, database schema, algorithms, deployment |
| **CHANGELOG.md** | History of changes and decisions | All stakeholders | Chronological log of features, fixes, pivots |
| **CLAUDE.md** | AI assistant developer guide | AI assistants (you!) | Quick reference, commands, gotchas, rules |

### Documentation Rules

**⚠️ IMPORTANT**: Before creating or modifying any markdown file:

1. **Check existing files first**: Review all 5 documentation files to ensure the content doesn't already exist
2. **Avoid duplication**: If information overlaps, consolidate into the appropriate existing file
3. **Follow the structure**: Each file has a specific purpose - respect the boundaries
4. **Registry requirement**: Any new .md file MUST be registered in this section with:
   - **Purpose**: What the file is for (1 sentence)
   - **Audience**: Who reads it
   - **Content**: What type of information it contains
5. **Get approval**: Before adding a new .md file, explain why existing files are insufficient

### Adding New Documentation

**Question to ask yourself**: "Can this information fit into one of the existing 5 files?"

- **Business feature/requirement?** → REQUIREMENTS.md
- **Technical implementation?** → ARCHITECTURE.md
- **Change history/decision?** → CHANGELOG.md
- **Quick start/usage?** → README.md
- **AI assistant guidance?** → CLAUDE.md (this file)

**If you still need a new file** (rare!), document it here first before creating it.

---

## 🎯 Quick Context

### What is this project?
A serverless multi-stage survey system for rating counterparty funds. Users answer questions across 3 stages, system calculates a risk rating (1-6 scale, where 1 is best).

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6), HTML5, CSS3
- **Backend**: Cloudflare Pages Functions (TypeScript)
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: GitHub Actions → Cloudflare Pages
- **Cost**: $0/month (free tier)

### Production Environment
- **Live URL**: https://fund-rating-survey.pages.dev/
- **Database ID**: 97b44427-e002-4b2e-9f17-c381edf42b01
- **Account ID**: f78ef49b741c2147bc71901d7b62a4a7
- **Region**: ENAM (Eastern North America)

---

## 🚀 Essential Commands

### Local Development
```bash
npm install             # Install dependencies
npm run reset-db        # Reset local DB with test data
npm run dev             # Start dev server (http://localhost:8788)
```

### Database Operations
```bash
# Local database
npx wrangler d1 execute fund-rating-db --local --command="SELECT * FROM counterparty"

# Production database
npx wrangler d1 execute fund-rating-db --remote --command="SELECT * FROM counterparty"

# Delete counterparty (production)
npx wrangler d1 execute fund-rating-db --remote --command="DELETE FROM counterparty WHERE cp_id = 'XXX'"
```

### Deployment
```bash
# Automatic (on git push to main)
git push origin main

# Manual
export CLOUDFLARE_API_TOKEN="ci2PkBiP7i0a3VrlpM7hV_lPfQSBpZc7v5oB6jHj"
export CLOUDFLARE_ACCOUNT_ID="f78ef49b741c2147bc71901d7b62a4a7"
npx wrangler pages deploy frontend --project-name=fund-rating-survey
```

---

## 📁 Project Structure

```
.
├── frontend/                # Static files (HTML/CSS/JS)
├── functions/api/           # API endpoints (TypeScript)
├── functions/utils/         # Business logic
│   ├── calculations.ts      # Rating algorithms ⭐
│   ├── db.ts               # Database utilities + CORS
│   └── stage3-config.ts    # Question definitions
├── schema.sql              # Database schema (7 tables)
├── wrangler.toml           # Cloudflare config
└── [5 .md files]           # Documentation
```

### Key Files to Know

**Frontend**:
- `frontend/js/config.js` - API base URL (local vs production)
- `frontend/js/api.js` - API wrapper functions
- `frontend/index.html` - Dashboard (main page)
- `frontend/review.html` - Survey summary with inline edit

**Backend**:
- `functions/api/stage2/[id].ts` - **CRITICAL**: Auto-recalc logic (lines 99-121)
- `functions/utils/calculations.ts` - All rating algorithms
- `functions/utils/stage3-config.ts` - 10 questions configuration

---

## ⚡ Common Development Tasks

### Task 1: Modify Rating Algorithms
**File**: `functions/utils/calculations.ts`
- Update `SECTOR_SCORES`, `CATEGORY_FACTORS` constants
- Modify `calculateStage2ABaseRating()` or `calculateStage2BBaseRating()`
- Test locally, then push to deploy

### Task 2: Change Stage 3 Questions
**File**: `functions/utils/stage3-config.ts`
- Edit question text, weights, or notch values
- **Rule**: Question weights must sum to 1.0
- Each question has 2-10 choices with notch values (-3 to +3)

### Task 3: Add New API Endpoint
1. Create file in `functions/api/` (e.g., `export.ts`)
2. Export handlers: `onRequestGet`, `onRequestPost`, `onRequestOptions`
3. Use `jsonResponse()` and `errorResponse()` from `utils/db.ts`
4. Update `frontend/js/api.js` with new function

### Task 4: Update Styling
**File**: `frontend/css/styles.css`
- Use CSS custom properties in `:root`
- Mobile breakpoint: `768px`
- Color scheme: `--primary-color`, `--success-color`, `--error-color`

---

## ⚠️ Important Gotchas

### 1. Database Binding
**Problem**: Dev server not connecting to database
**Solution**: Use `--binding DB=fund-rating-db` in dev command (already in package.json)

### 2. Auto-Recalculation
**Critical Logic**: When Stage 2 is edited, final rating must auto-recalculate
**Location**: `functions/api/stage2/[id].ts` lines 99-121
**Don't break this!** Many future bugs traced back to changes in this section

### 3. Weight Validation
**Rule**: Stage 2 weights must sum to 1.0
**Tolerance**: ±0.01 (floating-point precision)
**Validation**: Both client-side (frontend) and server-side (backend)

### 4. CORS Headers
**Requirement**: All API endpoints must return CORS headers
**Solution**: Export `onRequestOptions` handler in every API file
```typescript
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
```

### 5. Session Storage
**Where**: Browser `sessionStorage` (not database)
**Keys**:
- `current_counterparty_id`
- `current_counterparty_name`
- `stage1_route`
**Limitation**: Clears on browser close/refresh, tab-specific

### 6. SQLite Syntax
**Platform**: D1 uses SQLite 3.x
**Gotchas**:
- Use `datetime('now')` not `NOW()`
- Use `||` for string concatenation
- No `RETURNING` clause support
- Limited foreign key support

### 7. Rating Scale Semantics
**Scale**: 1-6
**Meaning**: **Lower is better** (1 = best, 6 = worst)
**Color Coding**:
- Negative notch = Green (improves rating, good)
- Positive notch = Red (worsens rating, bad)

---

## 🔍 Debugging Tips

### Check Dev Server Logs
```bash
# Server output shows:
# - Database binding status
# - API request logs
# - TypeScript compilation errors
```

### Test API Directly
```bash
curl http://localhost:8788/api/counterparties
curl http://localhost:8788/api/dashboard
curl http://localhost:8788/api/summary/CP...
```

### Inspect Database
```bash
# List all counterparties
npx wrangler d1 execute fund-rating-db --local --command="SELECT * FROM counterparty"

# Check rating_result
npx wrangler d1 execute fund-rating-db --local --command="SELECT * FROM rating_result"
```

### Browser Console
- Open DevTools (F12)
- Check Console tab for JavaScript errors
- Check Network tab for API failures
- Check Application → Session Storage for survey state

---

## 📊 Database Schema Quick Reference

**7 Tables**:
1. **counterparty** - Main entity (id, cp_id, name)
2. **stage1** - 3 questions + route (q1, q2, q3, route)
3. **stage2_opt1_row** - Route A rows (underline, sector, weight)
4. **stage2_opt2_row** - Route B rows (category, sector, weight)
5. **stage2_result** - Base rating (option, base_rating)
6. **stage3_answer** - 10 answers (question_no, choice_key)
7. **rating_result** - Final rating (base_rating, weighted_notch, final_rating)

**No foreign keys or cascading deletes** - Manual cleanup required

---

## 🎓 Before You Start Work

### New Session Checklist
When starting fresh in a new chat session:

1. **Read this file first** (CLAUDE.md) - Quick orientation
2. **Check CHANGELOG.md** - Recent changes and decisions
3. **Review the task** - What does the user want?
4. **Pick the right doc**:
   - Business question? → REQUIREMENTS.md
   - Technical question? → ARCHITECTURE.md
   - Need quick start? → README.md

### Don't Assume - Verify!
- **Don't assume** old session info is current - check files
- **Don't assume** API structure - read the code
- **Don't assume** database schema - query it
- **Do verify** production state with `curl` or database query

---

## 🛠️ Development Workflow

### Making Changes
1. Create feature branch (optional for POC)
2. Make changes and test locally (`npm run dev`)
3. Verify in browser (http://localhost:8788)
4. Test API endpoints with `curl`
5. Commit with clear message
6. Push to `main` → Auto-deploys in ~2 min

### Testing Workflow
```bash
# 1. Reset local database
npm run reset-db

# 2. Start dev server
npm run dev

# 3. Manual test in browser
open http://localhost:8788

# 4. Create a test survey end-to-end
# 5. Verify on dashboard
# 6. Test edit functionality
```

---

## 🚨 Known Issues & Limitations

- ⚠️ No authentication (public endpoints)
- ⚠️ No audit trail or version history
- ⚠️ No cascading deletes (orphaned data possible)
- ⚠️ Session storage only (clears on browser close)
- ⚠️ No rate limiting
- ⚠️ Weight precision tolerance (±0.01)

See REQUIREMENTS.md for complete list.

---

## 📞 Quick Help

### Where do I find...?
- **Rating formulas**: `functions/utils/calculations.ts`
- **API endpoints**: `functions/api/`
- **Stage 3 questions**: `functions/utils/stage3-config.ts`
- **Database schema**: `schema.sql`
- **Business rules**: REQUIREMENTS.md
- **Architecture diagrams**: ARCHITECTURE.md
- **Recent changes**: CHANGELOG.md
- **Getting started**: README.md

### Who to ask?
- **Product questions**: Check REQUIREMENTS.md
- **Technical questions**: Check ARCHITECTURE.md
- **"How do I...?"**: Check README.md
- **"Why did we...?"**: Check CHANGELOG.md
- **"How do I assist?"**: You're reading it! (CLAUDE.md)

---

## 🎯 Success Criteria

When your work is done, ensure:
- ✅ Code works locally (`npm run dev`)
- ✅ No TypeScript errors
- ✅ No console errors in browser
- ✅ API endpoints return expected data
- ✅ Tests pass (manual testing for now)
- ✅ Documentation updated (if significant change)
- ✅ Committed with clear message
- ✅ Pushed to trigger deployment

---

## 💡 Pro Tips

1. **Always test locally first** - Don't push untested code to production
2. **Read the code** - Don't assume, verify by reading the actual implementation
3. **Use the right tool** - Query database directly instead of guessing schema
4. **Follow patterns** - Match existing code style and structure
5. **Update docs** - Keep documentation in sync with code changes
6. **Ask when unsure** - Better to clarify than to assume wrongly
7. **Check CHANGELOG** - Recent changes may affect your work
8. **Respect the registry** - Don't create duplicate documentation

---

**Remember**: Lower rating is better (1=best, 6=worst). This trips people up! 🎯

---

**Status**: Ready for Development ✅
**Last Updated**: 2025-10-29
**Next Session**: Read CHANGELOG.md for latest changes
