from fastapi import APIRouter, Depends, HTTPException

from services.ai_service import (
    generate_first_question,
    evaluate_answer_and_generate_next_question,
)
from services.report_service import generate_interview_report
from database import get_connection
from auth_dependency import get_current_user
from models.interview import CreateInterviewRequest, SubmitAnswerRequest


router = APIRouter(
    prefix="/api/interviews",
    tags=["Interviews"]
)


def build_interview_focus(programming_language, focus_area):
    """
    Build one clear technical context string for Gemini.

    Examples:
    Java | Spring Boot, REST APIs, PostgreSQL
    C++ | DSA, STL
    General / Language-independent | DBMS, OS, Networking
    """
    language = programming_language or "General"

    if focus_area and focus_area.strip():
        return f"{language} | {focus_area.strip()}"

    return language


# =========================================================
# CREATE INTERVIEW
# =========================================================

@router.post("")
def create_interview(
    data: CreateInterviewRequest,
    current_user=Depends(get_current_user)
):
    with get_connection() as conn:
        with conn.cursor() as cursor:

            # Create interview
            cursor.execute(
                """
                INSERT INTO interviews (
                    user_id,
                    target_role,
                    experience_level,
                    interview_type,
                    programming_language,
                    focus_area,
                    difficulty,
                    total_questions
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    current_user["id"],
                    data.target_role,
                    data.experience_level,
                    data.interview_type,
                    data.programming_language,
                    data.focus_area,
                    data.difficulty,
                    data.total_questions,
                ),
            )

            interview = cursor.fetchone()

            ai_focus = build_interview_focus(
                data.programming_language,
                data.focus_area
            )

            # Generate first question using Gemini
            first_question = generate_first_question(
                target_role=data.target_role,
                experience_level=data.experience_level,
                interview_type=data.interview_type,
                focus_area=ai_focus,
                difficulty=data.difficulty,
            )

            # Save first AI question
            cursor.execute(
                """
                INSERT INTO interview_messages (
                    interview_id,
                    sender,
                    message_type,
                    content
                )
                VALUES (%s, %s, %s, %s)
                RETURNING *
                """,
                (
                    interview["id"],
                    "ai",
                    "question",
                    first_question,
                ),
            )

            first_message = cursor.fetchone()

            # Mark first question as active
            cursor.execute(
                """
                UPDATE interviews
                SET current_question = 1
                WHERE id = %s
                """,
                (interview["id"],),
            )

            conn.commit()

            interview["current_question"] = 1

    return {
        "message": "Interview started successfully",
        "interview": interview,
        "first_question": first_message,
    }


# =========================================================
# GET USER INTERVIEWS
# =========================================================

@router.get("")
def get_interviews(
    current_user=Depends(get_current_user)
):
    with get_connection() as conn:
        with conn.cursor() as cursor:

            cursor.execute(
                """
                SELECT *
                FROM interviews
                WHERE user_id = %s
                ORDER BY created_at DESC
                """,
                (current_user["id"],),
            )

            interviews = cursor.fetchall()

    return {
        "interviews": interviews
    }


# =========================================================
# SUBMIT ANSWER
# =========================================================

@router.post("/{interview_id}/answer")
def submit_answer(
    interview_id: int,
    data: SubmitAnswerRequest,
    current_user=Depends(get_current_user)
):
    with get_connection() as conn:
        with conn.cursor() as cursor:

            # Get interview and verify ownership
            cursor.execute(
                """
                SELECT *
                FROM interviews
                WHERE id = %s
                  AND user_id = %s
                """,
                (
                    interview_id,
                    current_user["id"],
                ),
            )

            interview = cursor.fetchone()

            if not interview:
                raise HTTPException(
                    status_code=404,
                    detail="Interview not found"
                )

            if interview["status"] != "active":
                raise HTTPException(
                    status_code=400,
                    detail="Interview is not active"
                )

            # Get current AI question
            cursor.execute(
                """
                SELECT *
                FROM interview_messages
                WHERE interview_id = %s
                  AND sender = 'ai'
                  AND message_type = 'question'
                ORDER BY created_at DESC
                LIMIT 1
                """,
                (interview_id,),
            )

            current_question = cursor.fetchone()

            if not current_question:
                raise HTTPException(
                    status_code=404,
                    detail="Current question not found"
                )

            # Save candidate answer
            cursor.execute(
                """
                INSERT INTO interview_messages (
                    interview_id,
                    sender,
                    message_type,
                    content
                )
                VALUES (%s, %s, %s, %s)
                RETURNING *
                """,
                (
                    interview_id,
                    "candidate",
                    "answer",
                    data.answer,
                ),
            )

            answer_message = cursor.fetchone()

            ai_focus = build_interview_focus(
                interview.get("programming_language"),
                interview.get("focus_area")
            )

            # Ask Gemini to evaluate answer
            evaluation = evaluate_answer_and_generate_next_question(
                target_role=interview["target_role"],
                experience_level=interview["experience_level"],
                interview_type=interview["interview_type"],
                focus_area=ai_focus,
                difficulty=interview["difficulty"],
                question=current_question["content"],
                answer=data.answer,
            )

            # Save evaluation
            cursor.execute(
                """
                INSERT INTO answer_evaluations (
                    interview_id,
                    question_message_id,
                    answer_message_id,
                    score,
                    correctness,
                    clarity,
                    depth,
                    relevance,
                    strengths,
                    missing_points,
                    misconceptions,
                    difficulty_change,
                    decision,
                    next_topic
                )
                VALUES (
                    %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s
                )
                RETURNING *
                """,
                (
                    interview_id,
                    current_question["id"],
                    answer_message["id"],
                    evaluation["score"],
                    evaluation["correctness"],
                    evaluation["clarity"],
                    evaluation["depth"],
                    evaluation["relevance"],
                    evaluation["strengths"],
                    evaluation["missing_points"],
                    evaluation["misconceptions"],
                    evaluation["difficulty_change"],
                    evaluation["decision"],
                    evaluation["next_topic"],
                ),
            )

            cursor.fetchone()

            # Check whether this was the final question
            if interview["current_question"] >= interview["total_questions"]:

                cursor.execute(
                    """
                    UPDATE interviews
                    SET status = 'completed',
                        completed_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    """,
                    (interview_id,),
                )

                conn.commit()

                return {
                    "message": "Interview completed successfully",
                    "answer": answer_message,
                    "next_question": None,
                    "completed": True,
                }

            # Save next adaptive question
            cursor.execute(
                """
                INSERT INTO interview_messages (
                    interview_id,
                    sender,
                    message_type,
                    content
                )
                VALUES (%s, %s, %s, %s)
                RETURNING *
                """,
                (
                    interview_id,
                    "ai",
                    "question",
                    evaluation["next_question"],
                ),
            )

            next_message = cursor.fetchone()

            # Increase question counter
            cursor.execute(
                """
                UPDATE interviews
                SET current_question = current_question + 1
                WHERE id = %s
                """,
                (interview_id,),
            )

            conn.commit()

    return {
        "message": "Answer submitted successfully",
        "answer": answer_message,
        "next_question": next_message,
        "completed": False,
    }


# ============================================================
# FINAL INTERVIEW REPORT
# ============================================================

@router.get("/{interview_id}/report")
def get_interview_report(
    interview_id: int,
    current_user=Depends(get_current_user)
):
    with get_connection() as conn:
        with conn.cursor() as cursor:

            # Get interview and verify ownership
            cursor.execute(
                """
                SELECT *
                FROM interviews
                WHERE id = %s AND user_id = %s
                """,
                (interview_id, current_user["id"])
            )

            interview = cursor.fetchone()

            if not interview:
                raise HTTPException(
                    status_code=404,
                    detail="Interview not found"
                )

            if interview["status"] != "completed":
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Interview must be completed "
                        "before generating a report"
                    )
                )

            # Return existing report if already generated
            cursor.execute(
                """
                SELECT *
                FROM interview_reports
                WHERE interview_id = %s
                """,
                (interview_id,)
            )

            existing_report = cursor.fetchone()

            if existing_report:
                return {
                    "message": "Interview report retrieved successfully",
                    "report": existing_report
                }

            # Get complete interview conversation
            cursor.execute(
                """
                SELECT sender, message_type, content
                FROM interview_messages
                WHERE interview_id = %s
                ORDER BY created_at ASC, id ASC
                """,
                (interview_id,)
            )

            messages = cursor.fetchall()

            if not messages:
                raise HTTPException(
                    status_code=404,
                    detail="Interview conversation not found"
                )

            conversation_parts = []

            for message in messages:
                if message["sender"] == "ai":
                    label = "Interviewer"
                else:
                    label = "Candidate"

                conversation_parts.append(
                    f"{label}: {message['content']}"
                )

            conversation = "\n\n".join(conversation_parts)

            ai_focus = build_interview_focus(
                interview.get("programming_language"),
                interview.get("focus_area")
            )

            # Generate AI report
            report = generate_interview_report(
                target_role=interview["target_role"],
                experience_level=interview["experience_level"],
                interview_type=interview["interview_type"],
                focus_area=ai_focus,
                difficulty=interview["difficulty"],
                conversation=conversation
            )

            # Save report
            cursor.execute(
                """
                INSERT INTO interview_reports (
                    interview_id,
                    overall_score,
                    technical_knowledge,
                    communication,
                    problem_solving,
                    depth,
                    answer_relevance,
                    strengths,
                    weaknesses,
                    missing_concepts,
                    summary,
                    recommended_topics,
                    suggested_difficulty
                )
                VALUES (
                    %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s
                )
                RETURNING *
                """,
                (
                    interview_id,
                    report["overall_score"],
                    report["technical_knowledge"],
                    report["communication"],
                    report["problem_solving"],
                    report["depth"],
                    report["answer_relevance"],
                    ", ".join(report["strengths"]),
                    ", ".join(report["weaknesses"]),
                    ", ".join(report["missing_concepts"]),
                    report["summary"],
                    ", ".join(report["recommended_topics"]),
                    report["suggested_difficulty"]
                )
            )

            saved_report = cursor.fetchone()

            conn.commit()

    return {
        "message": "Interview report generated successfully",
        "report": saved_report
    }