import { useEffect, useState } from "react";
import { api, removeToken } from "../api/client";

const LANGUAGES = [
  ["General", "General / Language-independent"],
  ["Python", "Python"],
  ["Java", "Java"],
  ["JavaScript", "JavaScript"],
  ["TypeScript", "TypeScript"],
  ["C", "C"],
  ["C++", "C++"],
  ["C#", "C#"],
  ["Go", "Go"],
  ["Rust", "Rust"],
  ["PHP", "PHP"],
  ["Kotlin", "Kotlin"],
  ["Swift", "Swift"],
  ["SQL", "SQL"],
  ["HTML/CSS", "HTML / CSS"],
  ["Other / Custom", "Other / Custom"],
];

const HERO_WORDS = [
  ["Prepare.", "Practice.", "Learn.", "Interview."],
  ["Answer.", "Think.", "Challenge.", "Analyze."],
  ["Adapt.", "Respond.", "Refine.", "Adapt."],
  ["Improve.", "Grow.", "Advance.", "Succeed."],
];

function Dashboard({
  onLogout,
  onInterviewStarted,
  onViewReport,
}) {
  const [interviews, setInterviews] = useState([]);
  const [showSetup, setShowSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [heroIndexes, setHeroIndexes] = useState([0, 0, 0, 0]);
  const [heroStep, setHeroStep] = useState(0);

  const [form, setForm] = useState({
    target_role: "Backend Developer",
    experience_level: "Entry Level",
    interview_type: "Technical",
    programming_language: "Python",
    focus_area: "FastAPI, REST APIs, PostgreSQL",
    difficulty: "Medium",
    total_questions: 5,
  });

  useEffect(() => {
    loadInterviews();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroStep((currentStep) => {
        const slot = currentStep % 4;

        setHeroIndexes((current) =>
          current.map((value, index) =>
            index === slot ? (value + 1) % HERO_WORDS[index].length : value
          )
        );

        return currentStep + 1;
      });
    }, 1050);

    return () => window.clearInterval(timer);
  }, []);

  async function loadInterviews() {
    try {
      setLoading(true);
      setError("");

      const data = await api.getInterviews();

      setInterviews(
        Array.isArray(data) ? data : data.interviews || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        name === "total_questions"
          ? Number(value)
          : value,
    }));
  }

  async function startInterview(event) {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");

      const data = await api.createInterview(form);

      const interview = data.interview;
      const firstQuestion = data.first_question;

      if (!interview?.id || !firstQuestion?.content) {
        throw new Error(
          "The server returned an incomplete interview."
        );
      }

      onInterviewStarted({
        interviewId: interview.id,
        interview,
        firstQuestion: firstQuestion.content,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function logout() {
    removeToken();
    onLogout();
  }

  const completed = interviews.filter(
    (item) => item.status === "completed"
  ).length;

  const active = interviews.filter(
    (item) => item.status === "active"
  ).length;

  const completionRate =
    interviews.length > 0
      ? Math.round((completed / interviews.length) * 100)
      : 0;

  return (
    <div className="workspace-page">
      <header className="workspace-nav">
        <div className="brand">
          <div className="brand-mark">
            <span>TP</span>
          </div>

          <div className="brand-copy">
            <h1>Tech<span className="brand-accent">Prep</span></h1>
            <span>Adaptive interview workspace</span>
          </div>
        </div>

        <div className="workspace-nav-right">
          <div className="engine-state">
            <span className="live-dot" />

            <div>
              <strong>AI engine</strong>
              <span>Online & adaptive</span>
            </div>
          </div>

          <button
            className="quiet-button"
            type="button"
            onClick={logout}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="workspace-shell">
        <section className="workspace-intro">
          <div className="workspace-intro-copy">
            <div
              className="section-tag command-center-type typewriter-label"
              aria-label="Your interview workspace. Developed by Asish."
            >
              <span className="typewriter-text" aria-hidden="true">
                <span className="typewriter-main" />
                <span className="typewriter-asish" />
              </span>
            </div>

            <div className="word-hero">
              <h2>
                {HERO_WORDS.map((words, slot) => {
                  const wordIndex = heroIndexes[slot];
                  const activeSlot = (heroStep - 1 + 4) % 4;

                  return (
                    <span
                      className={`hero-live-word hero-live-word-${slot + 1} ${activeSlot === slot ? "hero-live-word-active" : ""
                        }`}
                      key={`${slot}-${wordIndex}`}
                    >
                      {words[wordIndex]}
                    </span>
                  );
                })}
              </h2>
            </div>

            <p>
              Choose your role and stack. TechPrep handles the interview,
              follows your reasoning, adjusts the challenge, and builds your
              performance report.
            </p>


          </div>

          <button
            className="primary-button new-interview-button"
            type="button"
            onClick={() =>
              setShowSetup((current) => !current)
            }
          >
            <span>
              {showSetup
                ? "Close configuration"
                : "New interview"}
            </span>

            <span>{showSetup ? "×" : "+"}</span>
          </button>
        </section>

        <section className="workspace-overview">
          <article className="overview-primary">
            <div className="overview-label">
              PREPARATION OVERVIEW
            </div>

            <div className="overview-number-row">
              <strong>{interviews.length}</strong>

              <span>
                interview
                {interviews.length === 1 ? "" : "s"} recorded
              </span>
            </div>

            <div className="overview-progress">
              <div>
                <span>Completion rate</span>
                <strong>{completionRate}%</strong>
              </div>

              <div className="overview-track">
                <div
                  className="overview-fill"
                  style={{
                    width: `${completionRate}%`,
                  }}
                />
              </div>
            </div>
          </article>

          <article className="overview-stat">
            <span className="overview-icon">✓</span>

            <div>
              <span>Completed</span>
              <strong>{completed}</strong>
            </div>
          </article>

          <article className="overview-stat">
            <span className="overview-icon pulse-icon">
              ◌
            </span>

            <div>
              <span>Active</span>
              <strong>{active}</strong>
            </div>
          </article>

          <article className="overview-stat">
            <span className="overview-icon">AI</span>

            <div>
              <span>Interview mode</span>
              <strong className="overview-word">
                Adaptive
              </strong>
            </div>
          </article>
        </section>

        {showSetup && (
          <section className="configuration-panel">
            <div className="configuration-side">
              <span className="section-tag">
                BUILD YOUR SESSION
              </span>

              <h3>
                Tell the interviewer what you're preparing for.
              </h3>

              <p>
                Your configuration becomes hard context for the AI.
                Questions stay aligned with your role, language,
                stack and experience level.
              </p>

              <div className="configuration-preview">
                <span>SESSION PREVIEW</span>

                <strong>{form.target_role}</strong>

                <div className="preview-tags">
                  <span>{form.programming_language}</span>
                  <span>{form.difficulty}</span>
                  <span>{form.total_questions} questions</span>
                </div>

                {form.focus_area && (
                  <p>{form.focus_area}</p>
                )}
              </div>
            </div>

            <form
              className="configuration-form"
              onSubmit={startInterview}
            >
              <div className="form-section-heading">
                <span>01</span>

                <div>
                  <strong>Candidate target</strong>
                  <p>
                    Define the position and your current level.
                  </p>
                </div>
              </div>

              <div className="form-grid">
                <label className="field field-wide">
                  <span>Target role</span>

                  <input
                    name="target_role"
                    value={form.target_role}
                    onChange={handleChange}
                    placeholder="e.g. Backend Developer"
                    required
                  />
                </label>

                <label className="field">
                  <span>Experience level</span>

                  <select
                    name="experience_level"
                    value={form.experience_level}
                    onChange={handleChange}
                  >
                    <option>Entry Level</option>
                    <option>Junior</option>
                    <option>Mid Level</option>
                    <option>Senior</option>
                  </select>
                </label>

                <label className="field">
                  <span>Interview type</span>

                  <select
                    name="interview_type"
                    value={form.interview_type}
                    onChange={handleChange}
                  >
                    <option>Technical</option>
                    <option>Behavioral</option>
                    <option>Mixed</option>
                  </select>
                </label>
              </div>

              <div className="form-divider" />

              <div className="form-section-heading">
                <span>02</span>

                <div>
                  <strong>Technical context</strong>
                  <p>
                    Keep the AI inside the ecosystem you want to
                    practice.
                  </p>
                </div>
              </div>

              <div className="form-grid">
                <label className="field">
                  <span>Programming language</span>

                  <select
                    name="programming_language"
                    value={form.programming_language}
                    onChange={handleChange}
                  >
                    {LANGUAGES.map(
                      ([value, label]) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="field field-wide">
                  <span>Focus / frameworks</span>

                  <input
                    name="focus_area"
                    value={form.focus_area}
                    onChange={handleChange}
                    placeholder="e.g. Spring Boot, React, DSA, DBMS"
                  />
                </label>
              </div>

              <div className="form-divider" />

              <div className="form-section-heading">
                <span>03</span>

                <div>
                  <strong>Session intensity</strong>
                  <p>
                    Choose how demanding and how long the round
                    should be.
                  </p>
                </div>
              </div>

              <div className="form-grid">
                <label className="field">
                  <span>Difficulty</span>

                  <select
                    name="difficulty"
                    value={form.difficulty}
                    onChange={handleChange}
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </label>

                <label className="field">
                  <span>Number of questions</span>

                  <select
                    name="total_questions"
                    value={form.total_questions}
                    onChange={handleChange}
                  >
                    <option value="3">3 questions</option>
                    <option value="5">5 questions</option>
                    <option value="7">7 questions</option>
                    <option value="10">10 questions</option>
                  </select>
                </label>
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="configuration-submit">
                <div>
                  <span className="live-dot" />
                  Evaluation stays private during the interview.
                </div>

                <button
                  className="primary-button"
                  disabled={creating}
                >
                  <span>
                    {creating
                      ? "Preparing interview..."
                      : "Launch interview"}
                  </span>

                  {!creating && <span>↗</span>}
                </button>
              </div>
            </form>
          </section>
        )}

        {!showSetup && error && (
          <div className="error-message workspace-error">
            {error}
          </div>
        )}

        <section className="history-section">
          <div className="history-section-head">
            <div>
              <span className="section-tag">
                INTERVIEW ARCHIVE
              </span>

              <h3>Your sessions</h3>

              <p>
                Review completed rounds and continue building
                evidence of your progress.
              </p>
            </div>

            <button
              className="quiet-button"
              type="button"
              onClick={loadInterviews}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="history-empty">
              <span className="loading-ring" />
              Loading your interview history...
            </div>
          ) : interviews.length === 0 ? (
            <div className="history-empty">
              <span className="empty-symbol">＋</span>

              <strong>No interviews yet</strong>

              <p>
                Configure your first adaptive session to begin.
              </p>
            </div>
          ) : (
            <div className="session-table">
              <div className="session-table-head">
                <span>Interview</span>
                <span>Context</span>
                <span>Progress</span>
                <span>Status</span>
                <span />
              </div>

              {interviews.map((interview) => {
                const language =
                  interview.programming_language ||
                  "General";

                const isCompleted =
                  interview.status === "completed";

                return (
                  <article
                    className="session-row"
                    key={interview.id}
                  >
                    <div className="session-role">
                      <span className="session-index">
                        {String(interview.id).padStart(2, "0")}
                      </span>

                      <div>
                        <strong>
                          {interview.target_role}
                        </strong>

                        <span>
                          {interview.experience_level}
                        </span>
                      </div>
                    </div>

                    <div className="session-context">
                      <span>{language}</span>
                      <span>{interview.difficulty}</span>
                    </div>

                    <div className="session-progress">
                      <strong>
                        {interview.current_question}/
                        {interview.total_questions}
                      </strong>

                      <span>questions</span>
                    </div>

                    <div>
                      <span
                        className={`session-status ${isCompleted
                          ? "completed"
                          : "active"
                          }`}
                      >
                        <span />
                        {interview.status}
                      </span>
                    </div>

                    <div className="session-action">
                      {isCompleted ? (
                        <button
                          type="button"
                          onClick={() =>
                            onViewReport(interview.id)
                          }
                        >
                          Report
                          <span>↗</span>
                        </button>
                      ) : (
                        <span className="active-session-label">
                          In progress
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="workspace-footer">
  <span>TECHPREP</span>

  <span className="footer-credit">
    Built by <strong>Asish</strong> · © 2026
  </span>

  <span>
    Your preparation. Your evidence. Your next level.
  </span>
</footer>
    </div>
  );
}

export default Dashboard;

