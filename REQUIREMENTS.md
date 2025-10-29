# Business Requirements

**Project**: Fund Rating Survey POC
**Purpose**: Multi-stage questionnaire system for rating counterparty funds
**Last Updated**: 2025-10-29

---

## Overview

A serverless web application that collects portfolio information through a structured 3-stage workflow and calculates risk ratings using configurable algorithms. The system routes users through different questionnaire paths based on initial answers and produces a final rating score (1-6 scale, where 1 is best).

---

## Core Features

### 1. Counterparty Registration
- **User Story**: As a user, I want to register a new counterparty fund by providing a unique ID and name
- **Acceptance Criteria**:
  - CP ID must be unique across the system
  - Name is required
  - System generates internal ID (CP{timestamp}{random})
  - Timestamps recorded in UTC

### 2. Stage 1: Initial Assessment (3 Questions)
- **User Story**: As a user, I want to answer 3 yes/no questions that determine the appropriate rating path
- **Questions**:
  1. Stage 1 Question 1 (yes/no)
  2. Stage 1 Question 2 (yes/no)
  3. Stage 1 Question 3 (yes/no)
- **Routing Logic**:
  - Route A: 2 or more "yes" answers
  - Route B: Less than 2 "yes" answers
- **Acceptance Criteria**:
  - All 3 questions must be answered
  - Route is automatically calculated
  - Route determines Stage 2 form structure

### 3. Stage 2: Portfolio Data Entry

#### Route A (Option 1)
- **User Story**: As a user following Route A, I want to enter portfolio composition with underline and sector allocation
- **Fields per row**:
  - Underline: Text field (e.g., "Equity", "Fixed Income")
  - Sector: Dropdown (Sector 1, Sector 2, Sector 3)
  - Weight: Decimal (0.00 - 1.00)
- **Sector Scoring**:
  - Sector 1: 0.2
  - Sector 2: 0.4
  - Sector 3: 0.6
- **Base Rating Calculation**:
  ```
  weighted_score = Σ(weight × sector_score)
  base_rating = CEILING(weighted_score × 6)
  base_rating = CLAMP(base_rating, 1, 6)
  ```

#### Route B (Option 2)
- **User Story**: As a user following Route B, I want to enter portfolio composition with category and sector allocation
- **Fields per row**:
  - Category: Dropdown (Category 1, Category 2, Category 3)
  - Sector: Dropdown (Sector 1 through Sector 10)
  - Weight: Decimal (0.00 - 1.00)
- **Category Factors**:
  - Category 1: 0.8
  - Category 2: 1.0
  - Category 3: 1.2
- **Sector Scoring** (1-10):
  - Sector 1: 0.1
  - Sector 2: 0.2
  - ... (increments of 0.1)
  - Sector 10: 1.0
- **Base Rating Calculation**:
  ```
  weighted_score = Σ(weight × category_factor × sector_score)
  normalized_score = weighted_score / 1.2
  base_rating = CEILING(normalized_score × 6)
  base_rating = CLAMP(base_rating, 1, 6)
  ```

**Common Requirements for Both Routes**:
- Dynamic row addition/removal (minimum 1 row)
- Weights must sum to exactly 1.0 (±0.01 tolerance)
- Real-time weight sum validation
- Visual feedback (green when valid, red when invalid)

### 4. Stage 3: Risk Assessment (10 Questions)
- **User Story**: As a user, I want to answer 10 multiple-choice questions that adjust the base rating
- **Question Structure**:
  - Each question has 2-10 answer choices
  - Each choice has a "notch" value (-3 to +3)
  - Each question has a weight (sum of all weights = 1.0)
- **Final Rating Calculation**:
  ```
  weighted_notch = Σ(question_weight × choice_notch)
  final_rating = ROUND(base_rating + weighted_notch)
  final_rating = CLAMP(final_rating, 1, 6)
  ```
- **Acceptance Criteria**:
  - All 10 questions must be answered
  - Final rating calculated automatically
  - Rating displayed immediately after submission

### 5. Dashboard & Review
- **User Story**: As a user, I want to view all counterparties and their completion status
- **Dashboard Requirements**:
  - List all counterparties (paginated, 20 per page)
  - Search by CP ID or name
  - Display columns:
    - Counterparty ID
    - Name
    - Route (A/B)
    - Base Rating (1-6)
    - Weighted Notch (with color coding)
    - Final Rating (1-6, emphasized)
    - Last Updated timestamp
    - Actions (View button)
  - Sort by creation date (newest first)
- **Color Coding**:
  - Weighted Notch:
    - Negative values (green): Improves rating (better)
    - Positive values (red): Worsens rating (worse)
- **Review Page Requirements**:
  - Display all 4 sections separately:
    1. Counterparty Information
    2. Stage 1 - Questions and Route
    3. Stage 2 - Portfolio Data and Base Rating
    4. Stage 3 - Risk Assessment Answers
    5. Final Rating - Calculation breakdown
  - Each section (1-3) has inline "Edit" button in upper-right corner
  - Clicking "Edit" navigates to that stage with pre-populated data

### 6. Edit Functionality
- **User Story**: As a user, I want to edit any stage of a completed survey
- **Edit Stage 1**:
  - Pre-populate existing answers
  - If route changes, warn user and redirect to appropriate Stage 2 form
  - Stage 2 data is cleared if route changes
- **Edit Stage 2**:
  - Pre-populate existing rows
  - Allow row addition/removal
  - Recalculate base rating on save
  - **Critical**: If Stage 3 is completed, automatically recalculate final rating with new base rating
- **Edit Stage 3**:
  - Pre-populate existing answers
  - Recalculate final rating on save
- **After Edit**:
  - Show success message
  - Single "Return to Summary" button
  - User returns to review page to continue editing other stages

---

## Business Rules

### Rating Scale
- **Scale**: 1 to 6
- **Meaning**: 1 = Best (lowest risk), 6 = Worst (highest risk)
- **Display**: Always show as "X / 6" format

### Data Validation
1. **Weights**:
   - Must be decimal numbers between 0 and 1
   - Must sum to exactly 1.0 (tolerance: ±0.01)
   - Validated in real-time (client-side) and on server

2. **Unique Identifiers**:
   - CP ID must be unique across all counterparties
   - System-generated ID format: `CP{timestamp}{random}`

3. **Required Fields**:
   - All form fields are required (no partial submissions)
   - Each stage must be completed before accessing next stage

4. **Session Management**:
   - Survey progress tracked via browser session storage
   - Session cleared upon completing survey or returning to dashboard

### Calculation Precision
- All calculations use standard JavaScript floating-point arithmetic
- Final rating uses `Math.round()` for rounding to nearest integer
- Base rating uses `Math.ceil()` for rounding up
- Display weighted notch to 2 decimal places

### Auto-Recalculation
- **Trigger**: When Stage 2 is edited after Stage 3 completion
- **Behavior**:
  - Base rating recalculates based on new Stage 2 data
  - Final rating recalculates using new base rating + existing Stage 3 notch
  - Stage 3 answers are preserved (no re-entry required)
  - User sees updated final rating immediately

---

## Non-Functional Requirements

### Performance
- Page load time: < 2 seconds
- API response time: < 500ms
- Database query time: < 100ms

### Scalability
- Support 1000+ counterparties
- Cloudflare D1 limits:
  - 100,000 reads/day
  - 50,000 writes/day

### Availability
- 99% uptime (Cloudflare Pages SLA)
- Serverless architecture (auto-scaling)

### Security
- **Current**: No authentication (public POC)
- **Future**: Consider adding authentication for production

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Last 2 versions
- No IE11 support

### Mobile Responsiveness
- Responsive design (breakpoint: 768px)
- Touch-friendly buttons and inputs
- Readable on mobile screens

---

## Out of Scope (Current POC)

The following features are explicitly not included in the current implementation:

- User authentication and authorization
- Multi-user/tenant support
- Audit trail or version history
- Data export (CSV, Excel)
- Bulk import
- Email notifications
- Custom branding per client
- Analytics and reporting dashboards
- API rate limiting
- Cascading deletes (orphaned data possible)
- Multi-currency support
- Custom question sets per counterparty type
- Workflow approvals
- Comments or notes fields
- File attachments
- Integration with external systems

---

## Future Enhancements (Potential)

Ideas for future development phases:

1. **Authentication & Authorization**
   - User login system
   - Role-based access control (admin, user, viewer)
   - Organization/tenant separation

2. **Data Management**
   - CSV/Excel export of survey results
   - Bulk import of counterparties
   - Duplicate detection
   - Merge counterparties

3. **Advanced Reporting**
   - Charts and visualizations
   - Comparison reports
   - Trend analysis over time
   - Portfolio aggregation views

4. **Customization**
   - Custom question sets
   - Configurable rating scales
   - White-label branding
   - Custom email templates

5. **Workflow**
   - Multi-step approval process
   - Assign surveys to specific users
   - Deadline tracking
   - Email reminders

6. **Audit & Compliance**
   - Complete audit trail
   - Version history for all changes
   - Export audit logs
   - Data retention policies

7. **Integration**
   - REST API with authentication
   - Webhook notifications
   - SSO integration (SAML, OAuth)
   - Data sync with external systems

---

## Acceptance Testing Scenarios

### Scenario 1: Complete New Survey (Route A)
1. Register counterparty (CP001, "Test Fund A")
2. Answer Stage 1: Yes, Yes, No → Route A
3. Enter Stage 2A:
   - Row 1: Equity, Sector 3, 0.7
   - Row 2: Fixed Income, Sector 1, 0.3
   - Base Rating: 4
4. Answer Stage 3: All middle-choice answers
   - Weighted Notch: ~0
   - Final Rating: 4
5. View dashboard: Shows CP001 with rating 4
6. View review: All 4 sections displayed correctly

### Scenario 2: Complete New Survey (Route B)
1. Register counterparty (CP002, "Test Fund B")
2. Answer Stage 1: No, No, No → Route B
3. Enter Stage 2B:
   - Row 1: Category 2, Sector 5, 0.5
   - Row 2: Category 1, Sector 3, 0.5
   - Base Rating: 3
4. Answer Stage 3: All high-notch answers
   - Weighted Notch: +2.5
   - Final Rating: 6 (clamped)
5. View dashboard: Shows CP002 with red notch (+2.50)

### Scenario 3: Edit Stage 2 After Completion
1. Open existing survey (Final Rating: 3)
2. Click "Edit" on Stage 2 section
3. Change weights: Sector 3 from 0.5 → 0.9
4. Base Rating changes: 2 → 4
5. Save and return to review
6. Final Rating auto-updated: 3 → 5 (base 4 + notch 1.0)
7. Stage 3 answers unchanged (no re-entry)

### Scenario 4: Search and Filter
1. Create 5 counterparties with various names
2. Search "Fund" → Shows only counterparties with "Fund" in name
3. Search "CP001" → Shows only CP001
4. Clear search → Shows all counterparties

### Scenario 5: Weight Validation
1. Enter Stage 2 with 2 rows
2. Set weights: 0.6, 0.3 → Red warning (sum 0.9)
3. Adjust to: 0.7, 0.3 → Green indicator (sum 1.0)
4. Try to submit with 0.6, 0.3 → Error message blocks submission

---

## Success Metrics

### POC Success Criteria
- ✅ Complete end-to-end survey workflow functional
- ✅ Rating calculations accurate to specification
- ✅ Edit functionality preserves data integrity
- ✅ Dashboard displays all counterparties correctly
- ✅ Deployed to production and accessible via public URL
- ✅ No critical bugs in core workflow

### User Acceptance
- Users can complete a survey in < 10 minutes
- Edit workflow feels intuitive (no confusion)
- Dashboard provides at-a-glance overview
- Color coding aids quick interpretation

---

**Document Owner**: Product
**Reviewed By**: Engineering, QA
**Status**: Approved for POC Implementation ✅
