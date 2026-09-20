from google import genai
import json

from config import GEMINI_API_KEY


client = genai.Client(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-3-flash-preview"


def generate_interview_report(
    target_role,
    experience_level,
    interview_type,
    focus_area,
    difficulty,
    conversation
):
    prompt = f"""
You are the final evaluation engine for a professional
AI technical mock interview.

Generate a fair, evidence-based final report for the completed interview.

Candidate setup:
Target role: {target_role}
Experience level: {experience_level}
Interview type: {interview_type}
Programming language / technical focus:
{focus_area or "General / language-independent"}
Difficulty: {difficulty}

Interview conversation:
{conversation}

Evaluate the candidate ONLY from evidence contained in the interview.

=========================================================
CORE EVALUATION PHILOSOPHY
=========================================================

Evaluate technical understanding, not English writing quality.

Candidates are allowed to answer using:
- short phrases
- keywords
- bullet-style fragments
- pseudocode
- code
- concise technical statements
- complete sentences

Do NOT penalize the candidate for:
- grammar mistakes
- spelling mistakes
- punctuation
- capitalization
- incomplete sentences
- imperfect English
- lack of polished wording
- choosing a concise answer instead of a long explanation

If the technical meaning is understandable and correct,
give appropriate credit.

For example:

Question:
What is the difference between == and === in JavaScript?

Candidate:
"== coercion, === strict type + value"

This can demonstrate strong understanding despite not being
written as complete sentences.

Do NOT perform naive keyword matching.

A technical keyword only counts when it is used in a way that
demonstrates correct understanding of the question.

Unrelated buzzwords should receive no credit.

=========================================================
CONCEPT EVALUATION
=========================================================

For each answer, internally determine:

1. What essential concepts were required?
2. Which concepts did the candidate demonstrate?
3. Were those concepts technically correct?
4. Which important concepts were missing?
5. Were there misconceptions?
6. Was the answer relevant to the actual question?

Judge depth relative to:
- candidate experience level
- question difficulty
- scope of the question

Do not reward unnecessary verbosity.

A concise but complete answer can demonstrate excellent depth
when the question itself does not require a long explanation.

=========================================================
CODING / DEBUGGING EVALUATION
=========================================================

If the interview contains coding, debugging, pseudocode,
or code-reading questions, evaluate:

- correctness of the approach
- algorithm and logic
- whether the solution addresses the problem
- important edge cases
- appropriate language usage
- time complexity when relevant
- space complexity when relevant
- debugging reasoning when relevant

Do NOT claim that code was compiled or executed.

The code is being reviewed analytically.

Minor syntax or formatting mistakes should not heavily reduce
the score when the intended technical solution is clearly correct.

Actual logical errors, incorrect algorithms, unsafe assumptions,
or important missing cases should affect the evaluation.

=========================================================
SCORING DEFINITIONS
=========================================================

All scores must be numbers from 0 to 10.

overall_score:
Overall interview performance based on the complete interview.

technical_knowledge:
Accuracy and understanding of relevant technical concepts.

communication:
How understandable, relevant, and logically expressed the
candidate's technical ideas were.

IMPORTANT:
Communication is NOT an English grammar score.

Do not lower communication because of grammar, spelling,
sentence structure, accent-related wording, or concise phrasing
when the technical meaning is understandable.

Only lower communication when the technical meaning itself is
genuinely unclear, contradictory, disorganized, or difficult
to determine.

problem_solving:
Ability to reason through technical problems, coding tasks,
debugging situations, and practical scenarios.

depth:
Depth of demonstrated understanding relative to the candidate's
experience level and interview difficulty.

answer_relevance:
How directly the candidate answered the questions asked.

=========================================================
REPORT RULES
=========================================================

- Be fair and realistic.
- Do not invent answers the candidate did not give.
- Do not invent strengths that were not demonstrated.
- Do not invent weaknesses unsupported by the interview.
- Do not criticize grammar or English proficiency.
- Do not treat short answers as automatically weak.
- Do not reward long answers merely for being long.
- Base strengths on demonstrated evidence.
- Base weaknesses on demonstrated technical gaps.
- missing_concepts should identify meaningful concepts that were
  relevant but absent or insufficiently understood.
- recommended_topics should contain useful areas for improvement.
- suggested_difficulty must be exactly:
  Easy, Medium, or Hard.
- Do not expose private chain-of-thought or hidden reasoning.
- Provide only the requested report fields.

Return ONLY valid JSON using exactly this structure:

{{
    "overall_score": 0,
    "technical_knowledge": 0,
    "communication": 0,
    "problem_solving": 0,
    "depth": 0,
    "answer_relevance": 0,
    "strengths": [],
    "weaknesses": [],
    "missing_concepts": [],
    "summary": "",
    "recommended_topics": [],
    "suggested_difficulty": ""
}}

Return JSON only.
Do not use markdown.
Do not wrap the response in ```json.
"""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt
    )

    if not response.text:
        raise RuntimeError(
            "Gemini did not generate an interview report"
        )

    raw_text = response.text.strip()

    # Safety cleanup if Gemini wraps JSON in markdown.
    if raw_text.startswith("```json"):
        raw_text = raw_text[7:]

    if raw_text.startswith("```"):
        raw_text = raw_text[3:]

    if raw_text.endswith("```"):
        raw_text = raw_text[:-3]

    raw_text = raw_text.strip()

    try:
        report = json.loads(raw_text)
    except json.JSONDecodeError as error:
        raise RuntimeError(
            f"Gemini returned invalid report JSON: {raw_text}"
        ) from error

    required_fields = [
        "overall_score",
        "technical_knowledge",
        "communication",
        "problem_solving",
        "depth",
        "answer_relevance",
        "strengths",
        "weaknesses",
        "missing_concepts",
        "summary",
        "recommended_topics",
        "suggested_difficulty",
    ]

    for field in required_fields:
        if field not in report:
            raise RuntimeError(
                f"Gemini report missing required field: {field}"
            )

    score_fields = [
        "overall_score",
        "technical_knowledge",
        "communication",
        "problem_solving",
        "depth",
        "answer_relevance",
    ]

    for field in score_fields:
        value = report[field]

        if not isinstance(value, (int, float)):
            raise RuntimeError(
                f"Gemini returned invalid report score for {field}"
            )

        if value < 0 or value > 10:
            raise RuntimeError(
                f"Gemini returned out-of-range report score for {field}"
            )

    list_fields = [
        "strengths",
        "weaknesses",
        "missing_concepts",
        "recommended_topics",
    ]

    for field in list_fields:
        if not isinstance(report[field], list):
            report[field] = []

    if not isinstance(report["summary"], str):
        report["summary"] = str(report["summary"])

    if report["suggested_difficulty"] not in [
        "Easy",
        "Medium",
        "Hard",
    ]:
        report["suggested_difficulty"] = difficulty

    return report