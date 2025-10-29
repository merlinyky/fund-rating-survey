# Survey Configuration Guide

## Overview

This directory contains JSON configuration files that define all business logic for the Fund Rating Survey system. By externalizing this configuration, you can easily modify questions, scoring formulas, and weights without changing code.

## Files

### `survey-config.json`

**Purpose**: Complete survey configuration including all stages, questions, choices, weights, and calculation formulas.

**Structure**:

```
survey-config.json
├── version: Configuration version number
├── stages
│   ├── stage1: Initial Assessment (3 yes/no questions)
│   │   ├── questions: Array of 3 boolean questions
│   │   └── routing: Logic to determine Route A or B
│   ├── stage2: Portfolio Analysis
│   │   ├── routeA: Underline-based sector weighting
│   │   │   ├── fields: Form field definitions
│   │   │   ├── validation: Weight sum validation rules
│   │   │   └── calculation: Base rating formula & sector scores
│   │   └── routeB: Category and sector-based weighting
│   │       ├── fields: Form field definitions
│   │       ├── validation: Weight sum validation rules
│   │       └── calculation: Base rating formula, category factors & sector scores
│   └── stage3: Risk Assessment (10 questions)
│       ├── questions: Array of 10 questions with weights and choices
│       ├── validation: Weight sum validation
│       └── calculation: Final rating formula
└── rating_scale: Rating interpretation (1-6 scale)
```

## Configuration Details

### Stage 1: Initial Assessment

**Purpose**: Determine which Stage 2 route the user follows

**Configuration**:
- 3 yes/no questions
- Routing rule: Sum of "Yes" answers >= 2 → Route A, otherwise Route B

**To Modify**:
```json
{
  "stage1": {
    "questions": [
      {
        "id": "q1",
        "text": "Your question text here",
        "type": "boolean",
        "required": true
      }
    ],
    "routing": {
      "threshold": 2  // Change this to adjust routing logic
    }
  }
}
```

### Stage 2A: Portfolio Analysis - Route A

**Purpose**: Calculate base rating from underline-based sector weighting

**Configuration**:
- 3 sectors with predefined scores
- Formula: `ceil(sum(weight * sector_score) * 6)`

**Sector Scores** (affects base rating):
- Sector 1: 0.2 (best)
- Sector 2: 0.4 (medium)
- Sector 3: 0.6 (worst)

**To Modify Sector Scores**:
```json
{
  "stage2": {
    "routeA": {
      "calculation": {
        "sector_scores": {
          "Sector 1": 0.2,  // Change these values
          "Sector 2": 0.4,  // to adjust scoring
          "Sector 3": 0.6
        }
      }
    }
  }
}
```

**To Add/Remove Sectors**:
1. Update `sector_scores` object
2. Update `fields[1].options` array

### Stage 2B: Portfolio Analysis - Route B

**Purpose**: Calculate base rating from category and sector weighting

**Configuration**:
- 3 categories with multiplier factors
- 10 sectors with scores
- Formula: `ceil((sum(weight * category_factor * sector_score) / 1.2) * 6)`

**Category Factors** (multipliers):
- Category 1: 0.8 (reduces impact)
- Category 2: 1.0 (neutral)
- Category 3: 1.2 (increases impact)

**Sector Scores** (0.1 to 1.0 in increments of 0.1)

**To Modify**:
```json
{
  "stage2": {
    "routeB": {
      "calculation": {
        "normalization_divisor": 1.2,  // Adjust if you change max category factor
        "category_factors": {
          "Category 1": 0.8,  // Modify these
          "Category 2": 1.0,
          "Category 3": 1.2
        },
        "sector_scores": {
          "Sector 1": 0.1,  // Modify or add sectors
          "Sector 10": 1.0
        }
      }
    }
  }
}
```

### Stage 3: Risk Assessment

**Purpose**: Adjust base rating with weighted notch values from 10 questions

**Configuration**:
- 10 questions with varying number of choices (2-10)
- Each question has a weight (must sum to 1.0)
- Each choice has a notch value (-3 to +3)
- Formula: `round(base_rating + sum(question_weight * choice_notch))`

**Notch Scale**:
- Negative notches (-3 to -1): Improve rating (green, better)
- Zero notch (0): No impact
- Positive notches (+1 to +3): Worsen rating (red, worse)

**Current Weight Distribution**:
- Q1: 15% (overall risk profile)
- Q2: 12% (investment strategy)
- Q3: 10% (diversification)
- Q4: 13% (management track record)
- Q5: 8% (liquidity)
- Q6: 11% (leverage ratio)
- Q7: 9% (reporting transparency)
- Q8: 10% (historical performance)
- Q9: 7% (risk management)
- Q10: 5% (regulatory compliance)

**To Modify Questions**:
```json
{
  "stage3": {
    "questions": [
      {
        "no": 1,
        "text": "Your question text",
        "weight": 0.15,  // Must sum to 1.0 across all questions
        "choices": {
          "A": { "label": "Worst case", "notch": -3 },
          "B": { "label": "Best case", "notch": 3 }
        }
      }
    ]
  }
}
```

**To Add/Remove Choices**:
- Add new choice keys (e.g., "K", "L") to the `choices` object
- Each choice must have `label` (display text) and `notch` (impact value)

**To Adjust Question Weights**:
- Modify the `weight` value for each question
- Ensure all weights sum to 1.0 (± 0.01 tolerance)

## Rating Scale

**Scale**: 1-6 where **lower is better**
- 1: Excellent
- 2: Very Good
- 3: Good
- 4: Fair
- 5: Poor
- 6: Very Poor

## Validation Rules

### Weight Validation
All weights must sum to 1.0 with a tolerance of ±0.01

**Applies to**:
- Stage 2A: Portfolio row weights
- Stage 2B: Portfolio row weights
- Stage 3: Question weights

### Rating Bounds
All ratings are clamped between 1 and 6

## How to Use This Configuration

### Current Status
The JSON configuration file has been created but is **not yet integrated** into the codebase. The code still uses hardcoded values.

### Next Steps (To Be Implemented)
1. Create a configuration loader utility
2. Update TypeScript files to read from JSON
3. Update HTML files to dynamically generate forms
4. Add configuration validation
5. Test thoroughly

### Future Enhancements
- Configuration versioning system
- Migration tools for config updates
- Admin UI for config editing
- Configuration presets for different scenarios

## Example: Changing Stage 3 Question Weight

**Before** (Current in code):
```typescript
// functions/utils/stage3-config.ts
{
  no: 1,
  text: 'Question 1: How would you rate the overall risk profile?',
  weight: 0.15,  // 15%
  ...
}
```

**After** (Using JSON config):
```json
{
  "stage3": {
    "questions": [
      {
        "no": 1,
        "text": "Question 1: How would you rate the overall risk profile?",
        "weight": 0.20  // Changed to 20%
      }
    ]
  }
}
```

Then adjust other weights to maintain 1.0 sum.

## Troubleshooting

### Weights Don't Sum to 1.0
Check that all question/row weights add up to 1.0 (±0.01). Use a validator:
```bash
node -e "console.log([0.15, 0.12, 0.10, ...].reduce((a,b) => a+b, 0))"
```

### Rating Always Returns Same Value
Check sector scores and category factors - ensure they create meaningful differentiation

### Notch Values Not Working
- Verify notch range is -3 to +3
- Remember: Negative = better, Positive = worse
- Check question weights are properly distributed

## Documentation
For implementation details, see:
- ARCHITECTURE.md - Technical implementation
- REQUIREMENTS.md - Business requirements
- CLAUDE.md - Development guide
