import { useState } from "react";
import { api, getToken, setToken } from "./api/client";
import Dashboard from "./pages/Dashboard";
import InterviewRoom from "./pages/InterviewRoom";
import Report from "./pages/Report";
import "./App.css";
import "./AuthRecovery.css";

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
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">IA</div>

          <div>
            <h1>INTERVIEW/AI</h1>
            <span>Adaptive AI Interview Platform</span>
          </div>
        </div>

        <div className="system-status">
          <span className="status-dot"></span>
          AI Interview System
        </div>
      </header>

      <main className="auth-layout">
        <section className="hero-panel">
          <div className="eyebrow">AI-POWERED INTERVIEW PRACTICE</div>

          <h2>
            Practice interviews that
            <span> adapt to you.</span>
          </h2>

          <p className="hero-description">
            INTERVIEW/AI generates questions dynamically, evaluates your
            responses, adapts follow-up questions, and produces a detailed
            performance report at the end of every session.
          </p>

          <div className="feature-grid">
            <div className="feature-card">
              <strong>Dynamic Questions</strong>
              <p>Questions are generated for your role, stack and experience.</p>
            </div>

            <div className="feature-card">
              <strong>Adaptive Interviewing</strong>
              <p>Your answers influence the difficulty and next question.</p>
            </div>

            <div className="feature-card">
              <strong>AI Evaluation</strong>
              <p>Responses are evaluated across multiple technical dimensions.</p>
            </div>

            <div className="feature-card">
              <strong>Final Report</strong>
              <p>Review strengths, weaknesses, scores and recommended topics.</p>
            </div>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            <div className="auth-heading">
              <span className="mini-label">
                {mode === "login" ? "WELCOME BACK" : "CREATE ACCOUNT"}
              </span>

              <h3>
                {mode === "login"
                  ? "Continue your preparation"
                  : "Start practicing with AI"}
              </h3>

              <p>
                {mode === "login"
                  ? "Sign in to access your interviews and performance history."
                  : "Create an account to begin adaptive mock interviews."}
              </p>
            </div>

            <div className="auth-switch">
              <button
                className={mode === "login" ? "active" : ""}
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                type="button"
              >
                Sign in
              </button>

              <button
                className={mode === "register" ? "active" : ""}
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                type="button"
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit}>
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

              <button className="primary-button" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Sign in to INTERVIEW/AI"
                    : "Create account"}
              </button>
            </form>

            <div className="security-note">
              Your interview data is securely associated with your account.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
