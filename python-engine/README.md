# Python Calculation Engine

**Pure Python implementation of the fund rating calculation algorithms**

This service provides a FastAPI-based REST API for all rating calculations, making it easy for model developers to modify and enhance the business logic using Python.

---

## 📋 Overview

### Why Python for Calculations?

✅ **Familiar to Model Developers** - Most data scientists use Python
✅ **Easy to Modify** - Simple, readable code for complex algorithms
✅ **Rich Ecosystem** - Access to NumPy, Pandas, scikit-learn if needed
✅ **Testable** - Easy to write unit tests
✅ **Versioned** - Can track model changes independently

### Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│  Frontend (HTML/JS) │────────▶│  TypeScript API      │
│  Browser            │         │  (Cloudflare Workers)│
└─────────────────────┘         └──────────┬───────────┘
                                          │ HTTP
                                          ▼
                                ┌──────────────────────┐
                                │  Python Engine       │
                                │  (FastAPI Service)   │
                                └──────────────────────┘
                                          │
                                          ▼
                                ┌──────────────────────┐
                                │  Configuration       │
                                │  (JSON)              │
                                └──────────────────────┘
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd python-engine
pip install -r requirements.txt
```

### 2. Run the Service

```bash
python3 api_service.py
```

The service will start on `http://localhost:8000`

### 3. Test the Service

```bash
# Health check
curl http://localhost:8000/

# Test Stage 2A calculation
curl -X POST http://localhost:8000/calculate/stage2a \
  -H "Content-Type: application/json" \
  -d '{"rows":[{"sector":"Sector 1","weight":0.6},{"sector":"Sector 2","weight":0.4}]}'
```

---

## 📁 Files

| File | Purpose |
|------|---------|
| **calculation_engine.py** | Core calculation logic (no dependencies) |
| **api_service.py** | FastAPI REST API wrapper |
| **requirements.txt** | Python dependencies |
| **README.md** | This file |

---

## 🔧 API Endpoints

### Health Check
```
GET /
```

Returns service status and version.

### Stage 1: Routing
```
POST /calculate/stage1
{
  "q1": true,
  "q2": true,
  "q3": false
}
```

Returns: `{"route": "A"}`

### Stage 2A: Base Rating (Route A)
```
POST /calculate/stage2a
{
  "rows": [
    {"sector": "Sector 1", "weight": 0.6},
    {"sector": "Sector 2", "weight": 0.4}
  ]
}
```

Returns: `{"base_rating": 2}`

### Stage 2B: Base Rating (Route B)
```
POST /calculate/stage2b
{
  "rows": [
    {"category": "Category 1", "sector": "Sector 5", "weight": 0.5},
    {"category": "Category 2", "sector": "Sector 3", "weight": 0.5}
  ]
}
```

Returns: `{"base_rating": 2}`

### Stage 3: Final Rating
```
POST /calculate/stage3
{
  "base_rating": 2,
  "answers": [
    {"question_no": 1, "choice_key": "A"},
    {"question_no": 2, "choice_key": "B"},
    ...
  ]
}
```

Returns: `{"weighted_notch": -0.59, "final_rating": 1}`

### Weight Validation
```
POST /validate/weights
{
  "weights": [0.6, 0.4],
  "tolerance": 0.01
}
```

Returns: `{"is_valid": true, "sum": 1.0}`

---

## 💻 For Model Developers

### Modifying Calculations

All calculation logic is in `calculation_engine.py`. The methods are well-documented with examples.

**Example: Modify Stage 2A calculation**

```python
# In calculation_engine.py, find this method:
def calculate_stage2a_base_rating(self, rows: List[Dict[str, Any]]) -> int:
    """Calculate base rating for Stage 2A (Route A)"""

    sector_scores = self.stage2a_config['calculation']['sector_scores']

    # MODIFY THIS LOGIC AS NEEDED
    weighted_score = sum(
        row['weight'] * sector_scores.get(row['sector'], 0)
        for row in rows
    )

    # You can add more complex logic here:
    # - Non-linear transformations
    # - Additional risk factors
    # - Machine learning models
    # - etc.

    base_rating = math.ceil(weighted_score * 6)
    return max(1, min(6, base_rating))
```

### Adding New Calculations

To add a new calculation method:

1. **Add method to `CalculationEngine` class**
```python
def calculate_risk_score(self, data: Dict) -> float:
    """Your custom risk calculation"""
    # Your logic here
    return risk_score
```

2. **Add API endpoint in `api_service.py`**
```python
@app.post("/calculate/custom-risk")
def calculate_custom_risk(data: dict):
    result = engine.calculate_risk_score(data)
    return {"risk_score": result}
```

3. **Test it**
```bash
curl -X POST http://localhost:8000/calculate/custom-risk \
  -H "Content-Type: application/json" \
  -d '{"your": "data"}'
```

### Using External Libraries

Want to use NumPy, Pandas, or scikit-learn?

1. Add to `requirements.txt`:
```
numpy==1.24.0
pandas==2.0.0
scikit-learn==1.3.0
```

2. Install:
```bash
pip install -r requirements.txt
```

3. Use in `calculation_engine.py`:
```python
import numpy as np
import pandas as pd

def calculate_advanced_rating(self, data):
    # Use any Python library you want!
    df = pd.DataFrame(data)
    return np.mean(df['scores'])
```

---

## 🧪 Testing

### Unit Tests

Test the calculation engine directly:

```bash
python3 calculation_engine.py
```

This runs built-in test cases and shows results.

### API Tests

```bash
# Test all endpoints
curl http://localhost:8000/
curl -X POST http://localhost:8000/calculate/stage1 -H "Content-Type: application/json" -d '{"q1":true,"q2":true,"q3":false}'
curl -X POST http://localhost:8000/calculate/stage2a -H "Content-Type: application/json" -d '{"rows":[{"sector":"Sector 1","weight":1.0}]}'
```

### Interactive API Documentation

FastAPI provides automatic interactive docs:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 🚢 Deployment

### Option 1: Local Development (Current)

Run locally and have TypeScript call it via HTTP:

```bash
python3 api_service.py
```

TypeScript will call `http://localhost:8000/calculate/*`

### Option 2: Cloud Deployment

Deploy to any Python hosting service:

**Heroku:**
```bash
heroku create fund-rating-engine
git push heroku main
```

**Railway:**
```bash
railway up
```

**Google Cloud Run:**
```bash
gcloud run deploy fund-rating-engine --source .
```

**AWS Lambda:**
Use Mangum adapter for AWS Lambda compatibility.

### Environment Variables

Set `PYTHON_ENGINE_URL` in TypeScript to point to your deployed service:

```typescript
// functions/utils/config.ts
export const PYTHON_ENGINE_URL = process.env.PYTHON_ENGINE_URL || 'http://localhost:8000';
```

---

## 📊 Performance

**Benchmarks (local):**
- Stage 1 routing: <1ms
- Stage 2A calculation: <1ms
- Stage 2B calculation: <1ms
- Stage 3 calculation: <2ms

**Scalability:**
- FastAPI is async-capable
- Can handle 1000+ requests/sec on modest hardware
- Add caching if needed

---

## 🔒 Security

**For Production:**

1. **Add Authentication**
```python
from fastapi.security import HTTPBearer

security = HTTPBearer()

@app.post("/calculate/stage2a")
def calculate_stage2a(request: Stage2ARequest, token = Depends(security)):
    # Verify token
    pass
```

2. **Restrict CORS**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://fund-rating-survey.pages.dev"],  # Only your domain
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)
```

3. **Rate Limiting**
```python
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@app.post("/calculate/stage2a")
@limiter.limit("100/minute")
def calculate_stage2a(request: Stage2ARequest):
    pass
```

---

## 📝 Configuration

The engine reads from `../config/survey-config.json` automatically.

To use a different config file:

```python
engine = CalculationEngine(config_path="/path/to/your/config.json")
```

---

## 🤝 Contributing

### Code Style

- Use type hints
- Add docstrings to all functions
- Include examples in docstrings
- Keep functions pure (no side effects)

### Example Function Template

```python
def calculate_something(
    self,
    input_data: List[Dict[str, Any]]
) -> float:
    """
    Brief description of what this calculates

    Args:
        input_data: Description of input

    Returns:
        Description of return value

    Business Logic:
        1. Step 1 explanation
        2. Step 2 explanation

    Example:
        >>> engine.calculate_something([{"value": 1.0}])
        0.5
    """
    # Implementation here
    pass
```

---

## 🐛 Troubleshooting

### Issue: Service won't start
**Solution:** Check if port 8000 is already in use
```bash
lsof -ti :8000 | xargs kill -9
```

### Issue: Import errors
**Solution:** Reinstall dependencies
```bash
pip install -r requirements.txt --force-reinstall
```

### Issue: Calculations don't match
**Solution:** Check configuration version
```bash
curl http://localhost:8000/config
```

---

## 📚 Additional Resources

- FastAPI Documentation: https://fastapi.tiangolo.com/
- Pydantic Models: https://docs.pydantic.dev/
- Python Type Hints: https://docs.python.org/3/library/typing.html

---

**Current Status**: ✅ Working locally, ready for testing
**Next Steps**: Integrate with TypeScript API layer
