"""
FastAPI service for fund rating calculations
Provides REST API endpoints for the calculation engine
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from calculation_engine import CalculationEngine

# Initialize FastAPI app
app = FastAPI(
    title="Fund Rating Calculation Engine",
    description="Python-based calculation engine for fund rating system",
    version="1.0.0"
)

# Add CORS middleware to allow requests from Cloudflare Workers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Cloudflare domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize calculation engine
engine = CalculationEngine()


# Request/Response Models
class Stage1Request(BaseModel):
    """Stage 1 routing request"""
    q1: bool = Field(..., description="Answer to question 1")
    q2: bool = Field(..., description="Answer to question 2")
    q3: bool = Field(..., description="Answer to question 3")


class Stage1Response(BaseModel):
    """Stage 1 routing response"""
    route: str = Field(..., description="Route A or B")


class PortfolioRow2A(BaseModel):
    """Portfolio row for Stage 2A"""
    sector: str
    weight: float = Field(..., ge=0, le=1)


class Stage2ARequest(BaseModel):
    """Stage 2A calculation request"""
    rows: List[PortfolioRow2A] = Field(..., min_items=1)


class PortfolioRow2B(BaseModel):
    """Portfolio row for Stage 2B"""
    category: str
    sector: str
    weight: float = Field(..., ge=0, le=1)


class Stage2BRequest(BaseModel):
    """Stage 2B calculation request"""
    rows: List[PortfolioRow2B] = Field(..., min_items=1)


class Stage2Response(BaseModel):
    """Stage 2 calculation response"""
    base_rating: int = Field(..., ge=1, le=6)


class Answer(BaseModel):
    """Single Stage 3 answer"""
    question_no: int = Field(..., ge=1, le=10)
    choice_key: str


class Stage3Request(BaseModel):
    """Stage 3 calculation request"""
    base_rating: int = Field(..., ge=1, le=6)
    answers: List[Answer] = Field(..., min_items=10, max_items=10)


class Stage3Response(BaseModel):
    """Stage 3 calculation response"""
    weighted_notch: float
    final_rating: int = Field(..., ge=1, le=6)


class WeightValidationRequest(BaseModel):
    """Weight validation request"""
    weights: List[float]
    tolerance: float = Field(0.01, gt=0, le=0.1)


class WeightValidationResponse(BaseModel):
    """Weight validation response"""
    is_valid: bool
    sum: float


# API Endpoints
@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "service": "Fund Rating Calculation Engine",
        "version": engine.get_config_version(),
        "status": "healthy"
    }


@app.get("/config")
def get_config():
    """Get current configuration"""
    return {
        "version": engine.get_config_version(),
        "stage3_questions": len(engine.get_stage3_questions())
    }


@app.post("/calculate/stage1", response_model=Stage1Response)
def calculate_stage1(request: Stage1Request):
    """
    Calculate Stage 1 routing

    Determines whether to use Route A or Route B based on answers
    to 3 yes/no questions.
    """
    try:
        route = engine.determine_route(request.q1, request.q2, request.q3)
        return Stage1Response(route=route)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calculate/stage2a", response_model=Stage2Response)
def calculate_stage2a(request: Stage2ARequest):
    """
    Calculate Stage 2A base rating (Route A)

    Calculates base rating from underline-based sector weighting.
    """
    try:
        # Validate weights sum to 1.0
        weights = [row.weight for row in request.rows]
        if not engine.validate_weights(weights):
            raise HTTPException(
                status_code=400,
                detail=f"Weights must sum to 1.0 (current sum: {sum(weights)})"
            )

        # Convert to dicts for calculation
        rows_dict = [row.dict() for row in request.rows]
        base_rating = engine.calculate_stage2a_base_rating(rows_dict)

        return Stage2Response(base_rating=base_rating)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calculate/stage2b", response_model=Stage2Response)
def calculate_stage2b(request: Stage2BRequest):
    """
    Calculate Stage 2B base rating (Route B)

    Calculates base rating from category and sector-based weighting.
    """
    try:
        # Validate weights sum to 1.0
        weights = [row.weight for row in request.rows]
        if not engine.validate_weights(weights):
            raise HTTPException(
                status_code=400,
                detail=f"Weights must sum to 1.0 (current sum: {sum(weights)})"
            )

        # Convert to dicts for calculation
        rows_dict = [row.dict() for row in request.rows]
        base_rating = engine.calculate_stage2b_base_rating(rows_dict)

        return Stage2Response(base_rating=base_rating)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calculate/stage3", response_model=Stage3Response)
def calculate_stage3(request: Stage3Request):
    """
    Calculate Stage 3 final rating

    Calculates final rating by applying weighted notches from risk
    assessment answers to the base rating.
    """
    try:
        # Validate exactly 10 answers
        if len(request.answers) != 10:
            raise HTTPException(
                status_code=400,
                detail="Must provide exactly 10 answers"
            )

        # Convert to dicts for calculation
        answers_dict = [answer.dict() for answer in request.answers]
        weighted_notch, final_rating = engine.calculate_final_rating(
            request.base_rating,
            answers_dict
        )

        return Stage3Response(
            weighted_notch=weighted_notch,
            final_rating=final_rating
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/validate/weights", response_model=WeightValidationResponse)
def validate_weights(request: WeightValidationRequest):
    """
    Validate that weights sum to 1.0

    Used by frontend to validate portfolio weights before submission.
    """
    try:
        is_valid = engine.validate_weights(request.weights, request.tolerance)
        return WeightValidationResponse(
            is_valid=is_valid,
            sum=round(sum(request.weights), 4)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# For development/testing
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
