import { useEffect, useState } from "react";
import { api } from "../api/client";

function splitItems(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return String(value)
    .split(/,|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function scoreTone(score) {
  const value = Number(score) || 0;

  if (value >= 8) return "strong";
  if (value >= 6) return "steady";
  return "developing";
}


function PerformanceProfile({ scores }) {
  const size = 260;
  const center = size / 2;
  const radius = 92;
  const levels = [2, 4, 6, 8, 10];

  function point(index, value) {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / scores.length;
    const distance = radius * (Math.min(Math.max(Number(value) || 0, 0), 10) / 10);

    return {
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance,
    };
  }

  function polygonFor(value) {
    return scores
      .map((_, index) => {
        const p = point(index, value);
        return `${p.x},${p.y}`;
      })
      .join(" ");
  }

  const scorePolygon = scores
    .map((metric, index) => {
      const p = point(index, metric.score);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <section className="visual-intelligence">
      <div className="visual-intelligence-head">
        <div>
          <span className="section-tag">PERFORMANCE PROFILE</span>
          <h3>Your skill shape at a glance</h3>
        </div>

        <p>
          A visual map of the five dimensions measured in this interview.
        </p>
      </div>

      <div className="profile-layout">
        <div className="radar-card">
          <div className="radar-glow" />

          <svg
            className="performance-radar"
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label="Performance profile radar chart"
          >
            {levels.map((level) => (
              <polygon
                key={level}
                className="radar-grid"
                points={polygonFor(level)}
              />
            ))}

            {scores.map((_, index) => {
              const p = point(index, 10);

              return (
                <line
                  key={index}
                  className="radar-axis"
                  x1={center}
                  y1={center}
                  x2={p.x}
                  y2={p.y}
                />
              );
            })}

            <polygon
              className="radar-score"
              points={scorePolygon}
            />

            {scores.map((metric, index) => {
              const p = point(index, metric.score);

              return (
                <circle
                  key={metric.label}
                  className="radar-point"
                  cx={p.x}
                  cy={p.y}
                  r="4"
                />
              );
            })}
          </svg>

          <div className="radar-center">
            <strong>5</strong>
            <span>signals</span>
          </div>
        </div>

        <div className="profile-legend">
          {scores.map((metric, index) => (
            <div className="profile-legend-item" key={metric.label}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{metric.label}</strong>
                <small>{metric.score ?? "—"} / 10</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InterviewFlow() {
  const steps = [
    ["01", "Configure", "Role, level and focus"],
    ["02", "Interview", "Adaptive questioning"],
    ["03", "Evaluate", "Concept-based analysis"],
    ["04", "Improve", "Personalized study map"],
  ];

  return (
    <section className="interview-flow">
      <div className="interview-flow-head">
        <div>
          <span className="section-tag">ADAPTIVE LOOP</span>
          <h3>From practice to improvement</h3>
        </div>

        <span className="flow-status">
          <span className="live-dot" />
          Session analyzed
        </span>
      </div>

      <div className="flow-track">
        {steps.map(([number, title, description], index) => (
          <div className="flow-step" key={title}>
            <div className="flow-node">
              <span>{number}</span>
            </div>

            <div className="flow-copy">
              <strong>{title}</strong>
              <p>{description}</p>
            </div>

            {index < steps.length - 1 && (
              <div className="flow-connector" aria-hidden="true">
                <span />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Report({ interviewId, onDashboard }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReport();
  }, [interviewId]);

  async function loadReport() {
    try {
      setError("");

      const data = await api.getReport(interviewId);

      setReport(data.report);
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) {
    return (
      <div className="report-state-page">
        <div className="report-state-card">
          <div className="state-symbol">!</div>

          <h2>Report unavailable</h2>

          <p>{error}</p>

          <button
            type="button"
            className="primary-button"
            onClick={loadReport}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="report-state-page">
        <div className="report-generation">
          <div className="generation-orb">
            <span>AI</span>
          </div>

          <span className="section-tag">
            ANALYZING INTERVIEW
          </span>

          <h2>Building your performance report</h2>

          <p>
            Reviewing your answers, technical concepts,
            strengths and improvement areas.
          </p>

          <div className="generation-loader">
            <span />
          </div>
        </div>
      </div>
    );
  }

  const scores = [
    {
      label: "Technical knowledge",
      short: "TECH",
      score: report.technical_knowledge,
    },
    {
      label: "Communication",
      short: "COMM",
      score: report.communication,
    },
    {
      label: "Problem solving",
      short: "SOLVE",
      score: report.problem_solving,
    },
    {
      label: "Depth",
      short: "DEPTH",
      score: report.depth,
    },
    {
      label: "Answer relevance",
      short: "REL",
      score: report.answer_relevance,
    },
  ];

  const strengths = splitItems(report.strengths);
  const weaknesses = splitItems(report.weaknesses);
  const missingConcepts = splitItems(
    report.missing_concepts
  );
  const recommendedTopics = splitItems(
    report.recommended_topics
  );

  const overall = Number(report.overall_score) || 0;

  const overallPercent = Math.min(
    Math.max(overall * 10, 0),
    100
  );

  return (
    <div className="analysis-page">
      <header className="analysis-nav">
        <div className="brand">
          <div className="brand-mark">
            <span>TP</span>
          </div>

          <div className="brand-copy">
            <h1>Tech<span className="brand-accent">Prep</span></h1>
            <span>Adaptive interview workspace</span>
          </div>
        </div>

        <div className="analysis-nav-right">
          <span className="report-ready">
            <span className="live-dot" />
            Analysis complete
          </span>

          <button
            type="button"
            className="quiet-button"
            onClick={onDashboard}
          >
            Dashboard
          </button>
        </div>
      </header>

      <main className="analysis-shell">
        <section className="analysis-hero">
          <div className="analysis-heading">
            <span className="section-tag">
              INTERVIEW COMPLETE
            </span>

            <h2>
              Your interview,
              <span> decoded.</span>
            </h2>

            <p>
              A technical breakdown of what you demonstrated,
              where your answers were strongest and what to
              sharpen before the next round.
            </p>
          </div>

          <div className="score-orbit">
            <div
              className="score-orbit-ring"
              style={{
                "--score-angle": `${overallPercent * 3.6}deg`,
              }}
            >
              <div className="score-orbit-inner">
                <span>OVERALL</span>

                <div>
                  <strong>
                    {report.overall_score ?? "—"}
                  </strong>

                  <small>/10</small>
                </div>

                <p>
                  {overall >= 8
                    ? "Strong performance"
                    : overall >= 6
                      ? "Solid foundation"
                      : "Growth opportunity"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="performance-strip">
          <div className="performance-strip-head">
            <div>
              <span className="section-tag">
                PERFORMANCE SIGNAL
              </span>

              <h3>Score composition</h3>
            </div>

            <span className="performance-scale">
              0 — DEVELOPING
              <i />
              10 — STRONG
            </span>
          </div>

          <div className="metric-stack">
            {scores.map((metric) => {
              const value =
                Number(metric.score) || 0;

              return (
                <div
                  className="metric-row"
                  key={metric.label}
                >
                  <span className="metric-code">
                    {metric.short}
                  </span>

                  <strong>{metric.label}</strong>

                  <div className="metric-track">
                    <div
                      className={`metric-fill ${scoreTone(
                        value
                      )}`}
                      style={{
                        width: `${Math.min(
                          value * 10,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <span className="metric-value">
                    {metric.score ?? "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <PerformanceProfile scores={scores} />

        <InterviewFlow />

        <section className="analysis-summary">
          <div className="summary-index">
            <span>01</span>
            <div />
          </div>

          <div className="summary-copy">
            <span className="section-tag">
              INTERVIEWER SUMMARY
            </span>

            <h3>Performance overview</h3>

            <p>{report.summary || "No written performance summary was returned for this interview."}</p>
          </div>
        </section>

        <section className="insight-grid">
          <article className="insight-panel strength-panel">
            <div className="insight-head">
              <div className="insight-symbol">
                ↗
              </div>

              <div>
                <span className="section-tag">
                  STRENGTH SIGNALS
                </span>

                <h3>What you demonstrated well</h3>
              </div>
            </div>

            {strengths.length ? (
              <div className="insight-list">
                {strengths.map((item, index) => (
                  <div
                    className="insight-item"
                    key={`${item}-${index}`}
                  >
                    <span>
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <p>{item}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="insight-empty">
                No strengths were recorded.
              </p>
            )}
          </article>

          <article className="insight-panel growth-panel">
            <div className="insight-head">
              <div className="insight-symbol">
                +
              </div>

              <div>
                <span className="section-tag">
                  GROWTH SIGNALS
                </span>

                <h3>Where to strengthen</h3>
              </div>
            </div>

            {weaknesses.length ? (
              <div className="insight-list">
                {weaknesses.map((item, index) => (
                  <div
                    className="insight-item"
                    key={`${item}-${index}`}
                  >
                    <span>
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <p>{item}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="insight-empty">
                No major weaknesses were identified.
              </p>
            )}
          </article>
        </section>

        <section className="development-section">
          <div className="development-heading">
            <div>
              <span className="section-tag">
                DEVELOPMENT MAP
              </span>

              <h3>
                Turn this interview into your next study plan.
              </h3>
            </div>

            <div className="next-difficulty">
              <span>NEXT DIFFICULTY</span>

              <strong>
                {report.suggested_difficulty ||
                  "Medium"}
              </strong>
            </div>
          </div>

          <div className="development-grid">
            <article className="development-column">
              <span className="development-number">
                02
              </span>

              <h4>Concepts to revisit</h4>

              {missingConcepts.length ? (
                <div className="development-list">
                  {missingConcepts.map(
                    (concept, index) => (
                      <div
                        key={`${concept}-${index}`}
                      >
                        <span>◦</span>
                        <p>{concept}</p>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="development-empty">
                  No critical missing concepts were
                  identified.
                </p>
              )}
            </article>

            <article className="development-column">
              <span className="development-number">
                03
              </span>

              <h4>Recommended topics</h4>

              {recommendedTopics.length ? (
                <div className="topic-cloud">
                  {recommendedTopics.map(
                    (topic, index) => (
                      <span
                        key={`${topic}-${index}`}
                      >
                        {topic}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <p className="development-empty">
                  No additional topics were recommended.
                </p>
              )}
            </article>
          </div>
        </section>

        <section className="analysis-close">
          <div>
            <span className="section-tag">
              SESSION COMPLETE
            </span>

            <h3>
              Keep the evidence. Improve the gaps.
            </h3>

            <p>
              Your report is stored with this interview and
              can be reopened from your dashboard without
              generating it again.
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={onDashboard}
          >
            <span>Return to dashboard</span>
            <span>↗</span>
          </button>
        </section>
      </main>

      <footer className="workspace-footer">
        <span>TECHPREP</span>

        <span className="footer-credit">
          Built by <strong>Asish</strong> · © 2026
        </span>

        <span>
          Performance intelligence for deliberate practice.
        </span>
      </footer>
    </div>
  );
}

export default Report;