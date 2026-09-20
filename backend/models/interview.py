from pydantic import BaseModel, Field
from typing import Optional


class CreateInterviewRequest(BaseModel):
    target_role: str = Field(min_length=2, max_length=150)
    experience_level: str
    interview_type: str

    programming_language: str = Field(
        default="General",
        min_length=1,
        max_length=80
    )

    focus_area: Optional[str] = None
    difficulty: str

    total_questions: int = Field(
        default=10,
        ge=3,
        le=20
    )


class SubmitAnswerRequest(BaseModel):
    answer: str = Field(
        min_length=1,
        max_length=10000
    )