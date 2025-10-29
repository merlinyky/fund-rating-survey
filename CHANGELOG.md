# Change Log

Project history of significant changes, pivots, and decisions.

---

## 2025-10-29 - JSON Configuration System (Deployed)

**Type**: Major Refactoring
**Branch**: main
**Commit**: 5811c26
**Status**: Deployed to production ✅

**Changes**:
- Externalized all business logic to JSON configuration files
- Created `config/survey-config.json` with all stage definitions:
  - Stage 1: Questions and routing threshold
  - Stage 2A: Sector scores and calculation formula
  - Stage 2B: Category factors, sector scores, normalization divisor
  - Stage 3: 10 questions with weights, choices, and notch values
  - Rating scale metadata and interpretation
- Created `config/README.md` - Comprehensive configuration guide
- Implemented `functions/utils/config-loader.ts` - Configuration loader with validation
- Updated `functions/utils/calculations.ts` - Removed all hardcoded constants
- Updated `functions/api/stage3/[id].ts` - Uses config-loader
- Removed `functions/utils/stage3-config.ts` - Deprecated, replaced by JSON
- Updated `tsconfig.json` - Added JSON module support

**Benefits**:
- Single source of truth for all business logic
- Easy to modify weights, scores, questions without code changes
- No configuration drift between different files
- Version control for configuration changes
- Automatic weight validation on startup

**Testing**:
- All calculations verified correct locally
- Config loads successfully: "Loaded survey configuration version 1.0.0"
- Deployed and tested in production

**Rationale**: Hardcoded business logic was scattered across multiple TypeScript files, making it difficult to modify scoring formulas or question weights. Externalizing to JSON makes the system more maintainable and allows non-developers to modify configuration.

---

## 2025-10-29 - Python Calculation Engine (Feature Branch)

**Type**: New Feature
**Branch**: feature_python
**Commit**: 4e37373
**Status**: Ready for testing (not deployed)

**Changes**:
- Created pure Python implementation of all rating calculations
- `python-engine/calculation_engine.py` (300+ lines):
  - Stage 1: Route determination
  - Stage 2A: Base rating (Route A)
  - Stage 2B: Base rating (Route B)
  - Stage 3: Final rating calculation
  - Weight validation
  - Well-documented with examples
- `python-engine/api_service.py` (200+ lines):
  - FastAPI REST API service
  - 6 endpoints for all calculations
  - Automatic API documentation (Swagger/ReDoc)
  - Request/response validation with Pydantic
  - CORS enabled
- `python-engine/requirements.txt` - Minimal dependencies
- `python-engine/README.md` - Complete documentation

**Benefits**:
- Familiar to data scientists and model developers
- Easy to modify complex algorithms
- Access to Python ecosystem (NumPy, Pandas, scikit-learn)
- Independent from TypeScript codebase
- Can be deployed separately

**Testing**:
- Service runs on localhost:8000
- All endpoints tested and working
- Calculations match TypeScript implementation
- Interactive API docs available

**Rationale**: Model developers are more familiar with Python for complex calculations. Having a Python engine allows for easier experimentation with machine learning models and advanced statistical methods while keeping the TypeScript UI layer unchanged.

---

## 2025-10-29 - Wrangler v4 Upgrade

**Type**: Infrastructure
**Changes**:
- Upgraded Wrangler from v3.22.0 to v4.45.2
- Updated GitHub Actions workflow to use Node.js v20 (required by Wrangler v4)
- Removed unnecessary GitHub Pages deployment step
- Fixed deployment pipeline issues

**Impact**: Eliminated version warnings, improved build times, deployments now succeed

---

## 2025-10-29 - Documentation Consolidation

**Type**: Documentation
**Changes**:
- Consolidated 7 markdown files into 5 organized documents
- Created REQUIREMENTS.md for business requirements
- Created ARCHITECTURE.md for technical specifications
- Created CHANGELOG.md for change history
- Updated CLAUDE.md with documentation registry rules
- Removed: QUICK_START.md, DEPLOYMENT_GUIDE.MD, PROJECT_STATUS.md, SESSION_HANDOFF.md, IMPLEMENTATION_PLAN.md

**Rationale**: Too many overlapping documentation files made it hard to find information. New structure separates concerns clearly.

---

## 2025-10-29 - Production Deployment

**Type**: Infrastructure
**Changes**:
- Created Cloudflare D1 database (ID: 97b44427-e002-4b2e-9f17-c381edf42b01)
- Deployed to Cloudflare Pages (https://fund-rating-survey.pages.dev/)
- Configured D1 binding for production
- Set up GitHub Actions secrets (CF_ACCOUNT_ID, CF_API_TOKEN)
- Updated config.js with production API URL

**Impact**: Application now live and accessible to public

---

## 2025-10-29 - Dashboard Weighted Notch Column

**Type**: Feature Enhancement
**Changes**:
- Added "Weighted Notch" column to dashboard between Base Rating and Final Rating
- Color-coded values: negative (green) = better, positive (red) = worse
- Updated backend API to include weighted_notch in dashboard query
- Frontend displays formatted notch with +/- sign

**Rationale**: Users needed visibility into Stage 3 risk assessment impact on final rating

---

## 2025-10-29 - Streamlined Edit Workflow

**Type**: UX Improvement
**Changes**:
- Added inline "Edit" buttons to each stage section in review page
- Positioned edit buttons in upper-right corner of stage cards
- Removed "Edit Another Stage" button from all stage completion pages
- Users now only see "Return to Summary" after editing

**Rationale**: Previous flow required users to go through edit.html page to choose which stage to edit. New flow allows direct editing from review page, reducing clicks.

---

## 2025-10-29 - Stage 3 Separation in Review Page

**Type**: Feature Enhancement
**Changes**:
- Split review page into 4 distinct sections instead of 3
- Stage 3 Risk Assessment now separate from Final Rating
- Final Rating section clearly shows formula: Base Rating + Weighted Notch = Final Rating

**Rationale**: Stage 3 answers were hidden inside Final Rating section. Users needed to see what answers they gave to understand the weighted notch value.

---

## 2025-10-29 - Auto-Recalculation on Stage 2 Edit

**Type**: Feature
**Changes**:
- When Stage 2 is edited and base rating changes, final rating automatically recalculates
- Uses existing Stage 3 answers without requiring re-entry
- Implemented in functions/api/stage2/[id].ts lines 99-121

**Rationale**: Users editing portfolio data (Stage 2) shouldn't need to re-answer 10 risk questions (Stage 3) just to update final rating. Auto-recalc improves efficiency.

---

## 2025-10-29 - Database Binding Fix

**Type**: Bug Fix
**Changes**:
- Changed package.json dev command from `--d1 DB` to `--binding DB=fund-rating-db`
- Fixed issue where dev server created wrong database binding

**Impact**: Local development now connects to correct database with test data

---

## 2025-10-28 - Code Cleanup

**Type**: Maintenance
**Changes**:
- Removed 10 redundant documentation files
- Removed old init-db.sh script
- Removed migrations/ directory
- Updated wrangler.toml to remove migrations_dir reference

**Files Removed**:
- AGENTS.md
- CHANGES_SUMMARY.md
- DATABASE_PERSISTENCE.md
- EDIT_FEATURE_COMPLETE.md
- initial_plan.md
- LOCAL_TESTING.md
- SEED_DATA_QUICK_START.md
- SESSION_SUMMARY.md
- TESTING_GUIDE.md
- user_requirement.md

**Rationale**: Consolidate documentation and remove obsolete session-specific files

---

## 2025-10-28 - Review Page Structure Enhancement

**Type**: Feature
**Changes**:
- Review page now shows 4 separate sections: Stage 1, Stage 2, Stage 3, Final Rating
- Previously Stage 3 was combined with Final Rating

**Rationale**: Users needed clearer separation between risk assessment answers and final calculated rating

---

## 2025-10-28 - Edit Functionality Implementation

**Type**: Feature
**Changes**:
- Implemented edit mode for all 3 stages
- Added edit.html page with 3 edit options
- Pre-population of existing answers when editing
- Route change detection in Stage 1 with Stage 2 data warning

**Details**:
- Edit Stage 1: If route changes, Stage 2 data is cleared and user redirected
- Edit Stage 2: Existing rows pre-populated, allows adding/removing rows
- Edit Stage 3: All 10 answers pre-populated

---

## Earlier Development (Pre-2025-10-28)

### Initial Implementation
- 3-stage survey workflow created
- Dynamic form rows for Stage 2
- Weight validation (must sum to 1.0)
- Dashboard with search functionality
- Review page showing survey summary
- Database schema with 7 tables
- Rating calculation algorithms implemented
- Cloudflare Pages Functions API
- Local development with Wrangler

### Core Features
- Stage 1: 3 yes/no questions with routing logic
- Stage 2: Two different forms (Route A and Route B)
- Stage 3: 10 multiple-choice questions
- Final rating calculation with notch adjustment
- Session-based workflow using sessionStorage

---

## Key Decisions

### Technology Stack
**Decision**: Use Cloudflare Pages + D1 instead of traditional server + PostgreSQL
**Reasoning**:
- Free tier sufficient for POC
- Global edge network for low latency
- Serverless (no infrastructure management)
- Built-in CI/CD with GitHub
- SQLite familiar and sufficient for POC scale

### No Framework for Frontend
**Decision**: Use vanilla JavaScript instead of React/Vue
**Reasoning**:
- Faster page loads (no bundle)
- No build step required
- Easier to understand and maintain for POC
- Sufficient for current feature set

### TypeScript for Backend
**Decision**: Use TypeScript for Cloudflare Functions
**Reasoning**:
- Type safety catches errors early
- Better IDE support
- Self-documenting code
- Compiles to JavaScript (no runtime overhead)

### Session Storage
**Decision**: Use browser sessionStorage instead of database sessions
**Reasoning**:
- Simpler implementation for POC
- No server-side session management needed
- Sufficient for single-user workflow
- Clear on survey completion or dashboard return

### No Cascading Deletes
**Decision**: No foreign key constraints or cascading deletes in D1
**Reasoning**:
- D1 has limited FK support
- Manual cleanup gives more control
- Orphaned data acceptable for POC
- Can be addressed in production version

---

## Known Limitations (Current)

1. **No Authentication**: All endpoints are public
2. **No Audit Trail**: No version history or change tracking
3. **No Cascading Deletes**: Orphaned data possible
4. **Session Storage Only**: Clears on browser close/refresh
5. **Single Currency**: No multi-currency support
6. **Fixed Questions**: Stage 3 questions hardcoded (configurable in code)
7. **No Rate Limiting**: Potential for abuse

---

## Future Roadmap (Proposed)

### Phase 2 (Next)
- User authentication and authorization
- Data export (CSV/Excel)
- Audit trail and version history
- Bulk import of counterparties

### Phase 3
- Analytics dashboard with charts
- Email notifications
- Custom branding
- API documentation (OpenAPI/Swagger)

### Phase 4
- Multi-tenant support
- Workflow approvals
- Integration APIs
- Advanced reporting

---

**Last Updated**: 2025-10-29
**Maintained By**: Engineering Team
