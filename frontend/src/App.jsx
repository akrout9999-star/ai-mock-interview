import { useState } from "react";
import { api, getToken, setToken } from "./api/client";
import Dashboard from "./pages/Dashboard";
import InterviewRoom from "./pages/InterviewRoom";
import Report from "./pages/Report";
import "./App.css";

function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(getToken()));
  const [screen, setScreen] = useState("dashboard");
  const [session, setSession] = useState(null);
  const [reportInterviewId, setReportInterviewId] = useState(null);

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        await api.register({
          name: form.name,
          email: form.email,
          password: form.password,
        });

        setMode("login");
        setForm((current) => ({
          ...current,
          password: "",
        }));
      } else {
        const data = await api.login({
          email: form.email,
          password: form.password,
        });

        setToken(data.access_token);
        setAuthenticated(true);
        setScreen("dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleInterviewStarted(data) {
    setSession(data);
    setScreen("interview");
  }

  function handleInterviewCompleted(interviewId) {
    setReportInterviewId(interviewId);
    setScreen("report");
  }

  function handleViewReport(interviewId) {
    setReportInterviewId(interviewId);
    setScreen("report");
  }

  function returnToDashboard() {
    setSession(null);
    setReportInterviewId(null);
    setScreen("dashboard");
  }

  function logout() {
    setAuthenticated(false);
    setSession(null);
    setReportInterviewId(null);
    setScreen("dashboard");
  }

  if (authenticated) {
    if (screen === "interview" && session) {
      return (
        <InterviewRoom
          session={session}
          onCompleted={handleInterviewCompleted}
          onExit={returnToDashboard}
        />
      );
    }

    if (screen === "report" && reportInterviewId) {
      return (
        <Report
          interviewId={reportInterviewId}
          onDashboard={returnToDashboard}
        />
      );
    }

    return (
      <Dashboard
        onLogout={logout}
        onInterviewStarted={handleInterviewStarted}
        onViewReport={handleViewReport}
      />
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-glow auth-glow-one"></div>
      <div className="auth-glow auth-glow-two"></div>

      <header className="public-nav">
        <div className="brand">
          <div className="brand-mark">TP</div>

          <div className="brand-copy">
            <strong>TechPrep</strong>
            <span>Adaptive Interview Intelligence</span>
          </div>
        </div>

        <div className="public-nav-status">
          <span className="status-dot"></span>
          AI INTERVIEW SYSTEM
        </div>
      </header>

      <main className="auth-shell">
        <section className="auth-story">
          <div className="auth-kicker">
            <span className="kicker-line"></span>
            AI-POWERED INTERVIEW PRACTICE
          </div>

          <h2>
            Prepare. Answer.
            <br />
            Adapt. <span>Improve.</span>
          </h2>

          <p className="auth-lead">
            TechPrep generates role-specific interview questions, evaluates your
            responses, adapts each follow-up, and turns every session into
            actionable feedback.
          </p>

          <div className="auth-capabilities">
            <div className="capability">
              <span className="capability-index">01</span>

              <div>
                <strong>Dynamic questions</strong>
                <p>
                  Generated around your target role, technology stack and
                  experience level.
                </p>
              </div>
            </div>

            <div className="capability">
              <span className="capability-index">02</span>

              <div>
                <strong>Adaptive follow-ups</strong>
                <p>
                  Each response shapes what the interviewer asks you next.
                </p>
              </div>
            </div>

            <div className="capability">
              <span className="capability-index">03</span>

              <div>
                <strong>Performance intelligence</strong>
                <p>
                  Review strengths, weaknesses and focused development topics
                  after every session.
                </p>
              </div>
            </div>
          </div>

          <div className="auth-stack-row">
            <span>FASTAPI</span>
            <span>GEMINI</span>
            <span>POSTGRESQL</span>
            <span>ADAPTIVE AI</span>
          </div>
        </section>

        <section className="auth-access">
          <div className="access-card">
            <div className="access-card-top">
              <div className="access-orb">
                <div className="access-orb-core">AI</div>
              </div>

              <div>
                <h3>
                  {mode === "login"
                    ? "Continue your preparation"
                    : "Create your workspace"}
                </h3>

                <p>
                  {mode === "login"
                    ? "Access your interviews and performance history."
                    : "Create an account and begin adaptive interview practice."}
                </p>
              </div>
            </div>

            <div className="access-tabs">
              <button
                type="button"
                className={mode === "login" ? "active" : ""}
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Sign in
              </button>

              <button
                type="button"
                className={mode === "register" ? "active" : ""}
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                Register
              </button>
            </div>

            <form className="access-form" onSubmit={handleSubmit}>
              {mode === "register" && (
                <label>
                  Name
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                  />
                </label>
              )}

              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  minLength="8"
                  required
                />
              </label>

              {error && <div className="error-message">{error}</div>}

              <button
                className="primary-button access-submit"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Sign in to TechPrep"
                    : "Create account"}
              </button>
            </form>

            <div className="access-footer">
              <span className="status-dot"></span>
              <p>
                Your interview data is securely associated with your account.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="public-footer">
        <span>TECHPREP / ADAPTIVE INTERVIEW INTELLIGENCE</span>
        <span>AI-POWERED PRACTICE ENVIRONMENT</span>
      </footer>
    </div>
  );
}

export default App;