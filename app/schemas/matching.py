from pydantic import BaseModel


class InternshipRecommendation(BaseModel):
    internship_id: int
    match_percentage: int
    reason: str


class InternshipMatchingResponse(BaseModel):
    recommendations: list[InternshipRecommendation]