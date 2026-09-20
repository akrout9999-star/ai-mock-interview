import json

from google import genai

from config import GEMINI_API_KEY


client = genai.Client(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-3-flash-preview"


INTERVIEW_PRINCIPLES = """
INTERVIEW PHILOSOPHY:

1. This is a general-purpose technical interviewer.
   Never assume Python unless Python is explicitly part of the candidate's
   selected role, focus, language, or technology.

2. Support technical interviews across common languages and technologies,
   including Python, Java, JavaScript, TypeScript, C, C++, C#, Go, Rust,
   PHP, Kotlin, Swift, SQL, HTML/CSS, and other technologies supplied
   in the candidate's focus area.

3. The interview may include:
   - conceptual questions
   - short-answer questions
   - practical scenario questions
   - debugging questions
   - code-reading questions
   - coding questions
   - architecture/design questions when appropriate

4. Do not require long answers.
   A technically correct short answer can be excellent.

5. Candidates may answer using:
   - keywords
   - bullet-style phrases
   - short fragments
   - pseudocode
   - code
   - complete sentences

6. Do NOT penalize:
   - grammar mistakes
   - spelling mistakes
   - punctuation
   - capitalization
   - incomplete sentences
   - imperfect English
   - concise wording

   as long as the technical meaning is understandable.

7. Evaluate technical meaning and demonstrated concepts, not writing quality.

8. Never award correctness merely because expected keywords appear.
   Determine whether the candidate used the concepts correctly in context.

9. Communication/clarity means:
   "Can the technical meaning be understood?"
   It does NOT mean grammatical quality or sophisticated English.

10. For coding answers, evaluate:
    - correctness of the approach
    - algorithm/logic
    - whether it solves the requested problem
    - important edge cases
    - appropriate use of the selected language
    - time/space complexity when relevant

    Do not penalize harmless formatting or minor syntax mistakes when the
    intended solution is technically clear.

11. Never claim that submitted code was actually compiled or executed.
    You are reviewing it analytically.

12. Keep the interview appropriate to the candidate's stated experience.
"""


def generate_first_question(
    target_role,
    experience_level,
    interview_type,
    focus_area,
    difficulty
):
    prompt = f"""
You are an experienced professional interviewer conducting a realistic,
adaptive technical mock interview.

{INTERVIEW_PRINCIPLES}

Candidate setup:
Target role: {target_role}
Experience level: {experience_level}
Interview type: {interview_type}
Primary language / technology / focus: {focus_area or "General / language-independent"}
Difficulty: {difficulty}

Generate the FIRST interview question.

QUESTION SELECTION RULES:

- Ask exactly one question.
- Match the candidate's experience level.
- Match the requested difficulty.
- Stay relevant to the target role.
- Respect the candidate's selected language/technology/focus.
- If the focus is General or language-independent, ask a relevant
  language-neutral technical question.
- Do not unnecessarily switch to another programming language.
- The first question does not always need to be theoretical.
- Coding questions are allowed when appropriate.
- Debugging or code-reading questions are allowed when appropriate.
- Keep coding tasks reasonably answerable inside a mock interview.
- Do not require external libraries, internet access, or code execution.
- Do not provide the answer.
- Do not provide hints.
- Do not provide a score or feedback.
- Sound like a real interviewer.
- Keep the question concise.

Return only the interview question.
"""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt
    )

    question = response.text

    if not question:
        raise RuntimeError("Gemini did not generate a question")

    return question.strip()


def evaluate_answer_and_generate_next_question(
    target_role,
    experience_level,
    interview_type,
    focus_area,
    difficulty,
    question,
    answer
):
    prompt = f"""
You are the evaluation and adaptation engine for a professional
AI technical mock interviewer.

{INTERVIEW_PRINCIPLES}

Candidate setup:
Target role: {target_role}
Experience level: {experience_level}
Interview type: {interview_type}
Primary language / technology / focus: {focus_area or "General / language-independent"}
Current difficulty: {difficulty}

Interview question:
{question}

Candidate answer:
{answer}

Evaluate ONLY the candidate's actual answer.

IMPORTANT EVALUATION METHOD:

First determine the essential technical concepts needed to answer the
question correctly.

Then determine:
- which essential concepts the candidate demonstrated
- whether those concepts were used correctly
- which important concepts were missing
- whether the candidate expressed any technical misconception

Do NOT use grammar, spelling, sentence structure, punctuation,
capitalization, verbosity, or writing style as scoring criteria.

A concise answer containing the correct technical concepts may receive
a very high score or full score.

For example, an answer such as:

"== coercion, === strict type + value"

may demonstrate the essential JavaScript distinction even though it is
not written as complete sentences.

However, do NOT perform naive keyword matching. Keywords count only
when they demonstrate the correct meaning in the context of the
question.

For coding questions:
- analytically inspect the submitted code
- evaluate algorithm and logic
- evaluate correctness
- consider important edge cases
- consider complexity when relevant
- consider appropriate use of the selected language
- tolerate small syntax/formatting mistakes if the intended solution
  is technically clear
- never claim the code was compiled or executed

Return ONLY valid JSON.

Use exactly this structure:

{{
    "score": 0,
    "correctness": 0,
    "clarity": 0,
    "depth": 0,
    "relevance": 0,
    "strengths": [],
    "missing_points": [],
    "misconceptions": [],
    "difficulty_change": "same",
    "decision": "next",
    "next_topic": "",
    "next_question": ""
}}

SCORING:

Every score must be between 0 and 10.

score:
Overall technical quality of the answer.

correctness:
Technical and factual correctness.

clarity:
Whether the candidate's intended technical meaning can be understood.
Do NOT treat this as an English grammar score.

depth:
How much relevant understanding the candidate demonstrated relative
to what should reasonably be expected for their experience level and
the question.

relevance:
How directly the answer addresses the actual question.

SHORT ANSWER RULE:

Do not reduce the score merely because an answer is short.

If a short answer fully contains the concepts required by the question,
it can receive a score of 9 or 10.

Do not demand additional explanation when the question itself can be
fully answered with keywords, short phrases, code, or a concise statement.

difficulty_change must be exactly one of:
- easier
- same
- harder

decision must be exactly one of:
- follow_up
- next

ADAPTIVE INTERVIEW RULES:

- If the candidate demonstrates strong understanding, increase depth
  or difficulty when appropriate.
- If an important part is missing, ask a targeted follow-up when useful.
- If there is a misconception, test or clarify that concept.
- If the answer fully satisfies the question, normally move forward
  instead of unnecessarily asking for a longer explanation.
- Vary question styles throughout the interview.
- Include coding/debugging questions when appropriate for the role.
- Do not make every question a coding question.
- Do not make every question theoretical.
- Stay primarily within the selected language/technology/focus.
- Do not randomly drift into Python or another language.
- A mixed-stack role may naturally involve multiple relevant technologies.
- Do not reveal scores or evaluation inside next_question.
- Do not provide the correct answer.
- Do not provide hints.
- Ask exactly one question in next_question.
- Avoid repeating the previous question.
- Keep next_question concise.
- Sound like a professional interviewer.

Return JSON only.
Do not use markdown.
Do not wrap the JSON in ```json.
"""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt
    )

    raw_response = response.text

    if not raw_response:
        raise RuntimeError("Gemini did not evaluate the answer")

    cleaned_response = raw_response.strip()

    if cleaned_response.startswith("```"):
        cleaned_response = cleaned_response.replace("```json", "")
        cleaned_response = cleaned_response.replace("```", "")
        cleaned_response = cleaned_response.strip()

    try:
        evaluation = json.loads(cleaned_response)
    except json.JSONDecodeError as error:
        raise RuntimeError(
            f"Gemini returned invalid JSON: {cleaned_response}"
        ) from error

    required_fields = [
        "score",
        "correctness",
        "clarity",
        "depth",
        "relevance",
        "strengths",
        "missing_points",
        "misconceptions",
        "difficulty_change",
        "decision",
        "next_topic",
        "next_question"
    ]

    for field in required_fields:
        if field not in evaluation:
            raise RuntimeError(
                f"Gemini response missing required field: {field}"
            )

    score_fields = [
        "score",
        "correctness",
        "clarity",
        "depth",
        "relevance"
    ]

    for field in score_fields:
        value = evaluation[field]

        if not isinstance(value, (int, float)):
            raise RuntimeError(
                f"Gemini returned invalid score for {field}"
            )

        if value < 0 or value > 10:
            raise RuntimeError(
                f"Gemini returned out-of-range score for {field}"
            )

    list_fields = [
        "strengths",
        "missing_points",
        "misconceptions"
    ]

    for field in list_fields:
        if not isinstance(evaluation[field], list):
            evaluation[field] = []

    if evaluation["difficulty_change"] not in [
        "easier",
        "same",
        "harder"
    ]:
        evaluation["difficulty_change"] = "same"

    if evaluation["decision"] not in [
        "follow_up",
        "next"
    ]:
        evaluation["decision"] = "next"

    if not isinstance(evaluation["next_topic"], str):
        evaluation["next_topic"] = ""

    if not isinstance(evaluation["next_question"], str):
        raise RuntimeError(
            "Gemini returned an invalid next question"
        )

    if not evaluation["next_question"].strip():
        raise RuntimeError(
            "Gemini did not generate the next question"
        )

    evaluation["next_question"] = evaluation["next_question"].strip()

    return evaluation