"""
Fund Rating Calculation Engine
Pure Python implementation of rating algorithms
"""

import json
import math
from typing import List, Dict, Any, Tuple
from pathlib import Path


class CalculationEngine:
    """Main calculation engine for fund rating system"""

    def __init__(self, config_path: str = None):
        """
        Initialize calculation engine with configuration

        Args:
            config_path: Path to survey-config.json file
        """
        if config_path is None:
            # Default to config file in parent directory
            config_path = Path(__file__).parent.parent / "config" / "survey-config.json"

        with open(config_path, 'r') as f:
            self.config = json.load(f)

        # Extract frequently used config sections
        self.stage1_config = self.config['stages']['stage1']
        self.stage2a_config = self.config['stages']['stage2']['routeA']
        self.stage2b_config = self.config['stages']['stage2']['routeB']
        self.stage3_config = self.config['stages']['stage3']

    def determine_route(self, q1: bool, q2: bool, q3: bool) -> str:
        """
        Determine routing based on Stage 1 answers

        Args:
            q1, q2, q3: Boolean answers to 3 questions

        Returns:
            'A' or 'B' route designation

        Business Logic:
            Count Yes answers. If >= threshold, use Route A, else Route B
        """
        threshold = self.stage1_config['routing']['threshold']
        yes_count = sum([q1, q2, q3])

        return 'A' if yes_count >= threshold else 'B'

    def calculate_stage2a_base_rating(
        self,
        rows: List[Dict[str, Any]]
    ) -> int:
        """
        Calculate base rating for Stage 2A (Route A)

        Args:
            rows: List of dicts with keys: sector, weight

        Returns:
            Base rating (1-6)

        Business Logic:
            1. For each row: multiply weight by sector score
            2. Sum all weighted scores
            3. Multiply by 6 and round up (ceiling)
            4. Clamp between 1 and 6

        Example:
            rows = [
                {"sector": "Sector 1", "weight": 0.6},
                {"sector": "Sector 2", "weight": 0.4}
            ]

            Calculation:
            - Sector 1: 0.6 * 0.2 = 0.12
            - Sector 2: 0.4 * 0.4 = 0.16
            - Sum: 0.28
            - Rating: ceil(0.28 * 6) = ceil(1.68) = 2
        """
        sector_scores = self.stage2a_config['calculation']['sector_scores']

        # Calculate weighted score
        weighted_score = sum(
            row['weight'] * sector_scores.get(row['sector'], 0)
            for row in rows
        )

        # Apply formula: ceil(score * 6)
        base_rating = math.ceil(weighted_score * 6)

        # Clamp between 1 and 6
        return max(1, min(6, base_rating))

    def calculate_stage2b_base_rating(
        self,
        rows: List[Dict[str, Any]]
    ) -> int:
        """
        Calculate base rating for Stage 2B (Route B)

        Args:
            rows: List of dicts with keys: category, sector, weight

        Returns:
            Base rating (1-6)

        Business Logic:
            1. For each row: multiply weight * category_factor * sector_score
            2. Sum all weighted scores
            3. Normalize by dividing by max category factor
            4. Multiply by 6 and round up (ceiling)
            5. Clamp between 1 and 6

        Example:
            rows = [
                {"category": "Category 1", "sector": "Sector 5", "weight": 0.5},
                {"category": "Category 2", "sector": "Sector 3", "weight": 0.5}
            ]

            Calculation:
            - Row 1: 0.5 * 0.8 * 0.5 = 0.2
            - Row 2: 0.5 * 1.0 * 0.3 = 0.15
            - Sum: 0.35
            - Normalized: 0.35 / 1.2 = 0.2917
            - Rating: ceil(0.2917 * 6) = ceil(1.75) = 2
        """
        category_factors = self.stage2b_config['calculation']['category_factors']
        sector_scores = self.stage2b_config['calculation']['sector_scores']
        normalization_divisor = self.stage2b_config['calculation']['normalization_divisor']

        # Calculate weighted score with category factors
        weighted_score = sum(
            row['weight'] *
            category_factors.get(row['category'], 1.0) *
            sector_scores.get(row['sector'], 0)
            for row in rows
        )

        # Normalize and apply formula
        normalized = weighted_score / normalization_divisor
        base_rating = math.ceil(normalized * 6)

        # Clamp between 1 and 6
        return max(1, min(6, base_rating))

    def calculate_final_rating(
        self,
        base_rating: int,
        answers: List[Dict[str, Any]]
    ) -> Tuple[float, int]:
        """
        Calculate final rating from Stage 3 answers

        Args:
            base_rating: Base rating from Stage 2
            answers: List of dicts with keys: question_no, choice_key

        Returns:
            Tuple of (weighted_notch, final_rating)

        Business Logic:
            1. For each answer: multiply question weight by choice notch value
            2. Sum all weighted notches
            3. Add to base rating and round
            4. Clamp between 1 and 6

        Notch Semantics:
            - Negative notch: Improves rating (makes it lower/better)
            - Positive notch: Worsens rating (makes it higher/worse)
            - Rating scale: 1 (best) to 6 (worst)

        Example:
            base_rating = 3
            answers = [
                {"question_no": 1, "choice_key": "A"},  # notch = -2, weight = 0.15
                {"question_no": 2, "choice_key": "B"},  # notch = -1, weight = 0.12
                ...
            ]

            Calculation:
            - Q1: 0.15 * (-2) = -0.30
            - Q2: 0.12 * (-1) = -0.12
            - ...
            - Weighted notch: -0.42 (example)
            - Final: round(3 + (-0.42)) = round(2.58) = 3
        """
        questions = self.stage3_config['questions']

        # Create question lookup
        question_map = {q['no']: q for q in questions}

        # Calculate weighted notch
        weighted_notch = 0.0
        for answer in answers:
            question_no = answer['question_no']
            choice_key = answer['choice_key']

            question = question_map.get(question_no)
            if not question:
                continue

            choice = question['choices'].get(choice_key)
            if not choice:
                continue

            weighted_notch += question['weight'] * choice['notch']

        # Round weighted notch to 2 decimals
        weighted_notch = round(weighted_notch, 2)

        # Calculate final rating
        final_rating = round(base_rating + weighted_notch)

        # Clamp between 1 and 6
        final_rating = max(1, min(6, final_rating))

        return weighted_notch, final_rating

    def validate_weights(self, weights: List[float], tolerance: float = 0.01) -> bool:
        """
        Validate that weights sum to 1.0 within tolerance

        Args:
            weights: List of weight values
            tolerance: Acceptable deviation from 1.0

        Returns:
            True if weights sum to 1.0 ± tolerance
        """
        total = sum(weights)
        return abs(total - 1.0) <= tolerance

    def get_stage3_questions(self) -> List[Dict[str, Any]]:
        """
        Get Stage 3 questions configuration

        Returns:
            List of question dictionaries
        """
        return self.stage3_config['questions']

    def get_config_version(self) -> str:
        """Get configuration version"""
        return self.config.get('version', 'unknown')


# Example usage and testing
if __name__ == '__main__':
    # Initialize engine
    engine = CalculationEngine()

    print(f"Configuration Version: {engine.get_config_version()}")
    print()

    # Test Stage 1 routing
    print("=== Stage 1: Routing ===")
    route = engine.determine_route(True, True, False)
    print(f"Answers: Yes, Yes, No → Route: {route}")

    route = engine.determine_route(True, False, False)
    print(f"Answers: Yes, No, No → Route: {route}")
    print()

    # Test Stage 2A calculation
    print("=== Stage 2A: Base Rating ===")
    rows_2a = [
        {"sector": "Sector 1", "weight": 0.6},
        {"sector": "Sector 2", "weight": 0.4}
    ]
    base_rating = engine.calculate_stage2a_base_rating(rows_2a)
    print(f"Rows: {rows_2a}")
    print(f"Base Rating: {base_rating}")
    print()

    # Test Stage 2B calculation
    print("=== Stage 2B: Base Rating ===")
    rows_2b = [
        {"category": "Category 1", "sector": "Sector 5", "weight": 0.5},
        {"category": "Category 2", "sector": "Sector 3", "weight": 0.5}
    ]
    base_rating = engine.calculate_stage2b_base_rating(rows_2b)
    print(f"Rows: {rows_2b}")
    print(f"Base Rating: {base_rating}")
    print()

    # Test Stage 3 calculation
    print("=== Stage 3: Final Rating ===")
    answers = [
        {"question_no": i, "choice_key": "A"}
        for i in range(1, 11)
    ]
    weighted_notch, final_rating = engine.calculate_final_rating(2, answers)
    print(f"Base Rating: 2")
    print(f"Weighted Notch: {weighted_notch}")
    print(f"Final Rating: {final_rating}")
    print()

    # Test weight validation
    print("=== Weight Validation ===")
    weights = [0.15, 0.12, 0.10, 0.13, 0.08, 0.11, 0.09, 0.10, 0.07, 0.05]
    is_valid = engine.validate_weights(weights)
    print(f"Weights: {weights}")
    print(f"Sum: {sum(weights)}")
    print(f"Valid: {is_valid}")
