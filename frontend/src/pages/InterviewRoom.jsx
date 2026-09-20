import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";

function InterviewRoom({
  session,
  onCompleted,
  onExit,
}) {
  const [question, setQuestion] = useState(
    session.firstQuestion
  );

  const [answer, setAnswer] = useState("");
  const [questionNumber, setQuestionNumber] = useState(
    session.interview?.current_question || 1
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const answerRef = useRef(null);

  useEffect(() => {
    if (!submitting) {
      answerRef.current?.focus();
    }
  }, [questionNumber, submitting]);

  const interview = session.interview || {};

  const totalQuestions =
    interview.total_questions || 5;

  const role =
    interview.target_role || "Mock Interview";

  const language =
    interview.programming_language || "General";

  const focus =
    interview.focus_area || "General technical interview";

  const difficulty =
    interview.difficulty || "Medium";

  const experience =
    interview.experience_level || "Entry Level";

  const interviewType =
    interview.interview_type || "Technical";

  const progress = Math.min(
    (questionNumber / totalQuestions) * 100,
    100
  );

  const remainingQuestions = Math.max(
    totalQuestions - questionNumber,
    0
  );

  async function submitAnswer(event) {
    event.preventDefault();

    if (submitting) return;

    const cleanAnswer = answer.trim();

    if (!cleanAnswer) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const data = await api.submitAnswer(
        session.interviewId,
        cleanAnswer
      );

      if (data.completed) {
        onCompleted(session.interviewId);
        return;
      }

      const nextQuestion = data.next_question;

      if (!nextQuestion?.content) {
        throw new Error(
          "The server did not return the next interview question."
        );
      }

      setQuestion(nextQuestion.content);

      setQuestionNumber(
        (current) => current + 1
      );

      setAnswer("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleExit() {
    if (submitting) return;

    const shouldExit = window.confirm(
      "Exit this interview session? Your current unsent answer will be lost."
    );

    if (shouldExit) {
      onExit();
    }
  }

  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      (event.ctrlKey || event.metaKey)
    ) {
      event.preventDefault();

      if (!submitting && answer.trim()) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  }

  return (
    <div className="live-page">
      <header className="live-nav">
        <div className="brand">
          <div className="brand-mark">
            <span>TP</span>
          </div>

          <div className="brand-copy">
            <h1>Tech<span className="brand-accent">Prep</span></h1>
            <span>Adaptive interview session</span>
          </div>
        </div>

        <div className="live-nav-center">
          <span className="live-dot" />
          <strong>Interview in progress</strong>
        </div>

        <button
          className="quiet-button"
          type="button"
          onClick={handleExit}
          disabled={submitting}
        >
          Exit session
        </button>
      </header>

      <main className="live-shell">
        <aside className="interview-rail">
          <div className="rail-heading">
            <span className="section-tag">
              SESSION
            </span>

            <h2>{role}</h2>

            <p>
              {experience} · {interviewType}
            </p>
          </div>

          <div className="rail-context">
            <div className="rail-context-item">
              <span>Language</span>
              <strong>{language}</strong>
            </div>

            <div className="rail-context-item">
              <span>Difficulty</span>
              <strong>{difficulty}</strong>
            </div>

            <div className="rail-context-item rail-context-wide">
              <span>Focus</span>
              <strong>{focus}</strong>
            </div>
          </div>

          <div className="rail-progress-block">
            <div className="rail-progress-head">
              <span>Interview progress</span>

              <strong>
                {questionNumber}/{totalQuestions}
              </strong>
            </div>

            <div className="rail-progress-track">
              <div
                className="rail-progress-fill"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <p>
              {remainingQuestions === 0
                ? "Final question"
                : `${remainingQuestions} question${
                    remainingQuestions === 1
                      ? ""
                      : "s"
                  } remaining`}
            </p>
          </div>

          <div className="rail-intelligence">
            <div className="rail-ai-symbol">
              AI
            </div>

            <div>
              <strong>Adaptive mode</strong>

              <p>
                The next question is selected from your
                previous response.
              </p>
            </div>
          </div>

          <div className="rail-private">
            <span>◈</span>

            <p>
              Scores and evaluation remain hidden until
              the interview ends.
            </p>
          </div>
        </aside>

        <section className="interview-stage">
          <div className="stage-topline">
            <div className="stage-question-index">
              <span>
                QUESTION{" "}
                {String(questionNumber).padStart(
                  2,
                  "0"
                )}
              </span>

              <div className="stage-line" />
            </div>

            <div className="stage-tags">
              <span>{language}</span>
              <span>{difficulty}</span>
            </div>
          </div>

          <article className="ai-question">
            <div className="ai-question-head">
              <div className="ai-presence">
                <div className="ai-presence-mark">
                  AI
                </div>

                <div>
                  <strong>AI Interviewer</strong>
                  <span>
                    Listening & adapting
                  </span>
                </div>
              </div>

              <div className="ai-signal">
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>

            <div className="question-copy">
              <h3>
                {question ||
                  "Preparing your next interview question..."}
              </h3>
            </div>

            <div className="question-note">
              <span>INTERVIEW NOTE</span>

              <p>
                Answer with the technical detail the
                question needs. Concise answers, keywords,
                pseudocode and code are all valid.
              </p>
            </div>
          </article>

          <form
            className="response-workspace"
            onSubmit={submitAnswer}
            aria-busy={submitting}
          >
            <div className="response-toolbar">
              <div>
                <span className="section-tag">
                  YOUR RESPONSE
                </span>

                <strong>
                  Think clearly. Answer directly.
                </strong>
              </div>

              <div className="response-format">
                <span>TEXT</span>
                <span>CODE</span>
                <span>SHORT ANSWER</span>
              </div>
            </div>

            <div className="response-editor">
              <div className="editor-gutter">
                <span>01</span>
                <span>02</span>
                <span>03</span>
                <span>04</span>
                <span>05</span>
                <span>06</span>
              </div>

              <textarea
                ref={answerRef}
                id="candidate-answer"
                aria-label="Your interview response"
                value={answer}
                onChange={(event) =>
                  setAnswer(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder={
                  language === "General"
                    ? "Type your answer here..."
                    : `Type your ${language} answer, explanation or code here...`
                }
                disabled={submitting}
                spellCheck="false"
                required
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="response-footer">
              <div className="response-hints">
                <span>
                  <kbd>Ctrl</kbd>
                  <span>+</span>
                  <kbd>Enter</kbd>
                  <span>to submit</span>
                </span>

                <span>
                  {answer.length.toLocaleString()} characters
                </span>
              </div>

              <button
                type="submit"
                className="primary-button response-submit"
                disabled={
                  submitting || !answer.trim()
                }
              >
                {submitting ? (
                  <>
                    <span className="button-spinner" />
                    Evaluating response
                  </>
                ) : (
                  <>
                    Submit answer
                    <span>↗</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {submitting && (
            <div className="evaluation-state">
              <div className="evaluation-orb">
                <span />
              </div>

              <div>
                <strong>
                  Evaluating your response
                </strong>

                <p>
                  Checking technical concepts and
                  preparing the next adaptive question.
                </p>
              </div>

              <div className="evaluation-steps">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

        </section>
      </main>
            

      <footer className="workspace-footer interview-footer">
        <span>TECHPREP</span>

        <span className="footer-credit">
          Built by <strong>Asish</strong> · © 2026
        </span>

        <span>
          Adaptive interviewing for deliberate practice.
        </span>
      </footer>
    </div>
  );
}

export default InterviewRoom;

