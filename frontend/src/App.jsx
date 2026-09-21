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

  const isLogin = mode === "login";

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      if (!isLogin) {
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

        return;
      }

      const data = await api.login({
        email: form.email,
        password: form.password,
      });

      setToken(data.access_token);
      setAuthenticated(true);
      setScreen("dashboard");
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
    setToken(null);
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
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <header className="public-nav">
        <div className="brand">
          <div className="brand-mark">TP</div>

          <div className="brand-copy">
            <strong>
              Tech<span>Prep</span>
            </strong>
            <span>Adaptive interview workspace</span>
          </div>
        </div>

        <div className="public-nav-status">
          <span className="status-dot" />
          AI INTERVIEW SYSTEM
        </div>
      </header>

      <main className="auth-shell">
        <section className="auth-story">
          <div className="auth-kicker">
            <span className="kicker-line" />
            AI-POWERED INTERVIEW PRACTICE
          </div>

          <h2>
            Prepare. Answer.
            <br />
            Adapt. <span>Improve.</span>
          </h2>

          <p className="auth-lead">
            Practice adaptive interviews that respond to your answers, challenge
            your reasoning, and turn every session into actionable feedback.
          </p>

          <div className="auth-capabilities">
            <div className="capability">
              <span className="capability-index">01</span>
              <div>
                <strong>Adaptive questions</strong>
                <p>Questions evolve with your answers and experience.</p>
              </div>
            </div>

            <div className="capability">
              <span className="capability-index">02</span>
              <div>
                <strong>AI evaluation</strong>
                <p>Get focused feedback on how you reason and respond.</p>
              </div>
            </div>

            <div className="capability">
              <span className="capability-index">03</span>
              <div>
                <strong>Performance report</strong>
                <p>Leave every session knowing exactly what to improve.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-access">
          <div className="access-card">
            <div className="access-card-top">
              <div className="access-orb">
                <span className="access-orb-core" />
              </div>

              <div>
                <span className="mini-label">
                  {isLogin ? "WELCOME BACK" : "CREATE ACCOUNT"}
                </span>

                <h3>
                  {isLogin
                    ? "Continue your preparation"
                    : "Start your preparation"}
                </h3>

                <p>
                  {isLogin
                    ? "Sign in to access your interviews and performance history."
                    : "Create your account and begin an adaptive mock interview."}
                </p>
              </div>
            </div>

            <div className="access-tabs">
              <button
                className={isLogin ? "active" : ""}
                type="button"
                onClick={() => changeMode("login")}
              >
                Sign in
              </button>

              <button
                className={!isLogin ? "active" : ""}
                type="button"
                onClick={() => changeMode("register")}
              >
                Register
              </button>
            </div>

            <form className="access-form" onSubmit={handleSubmit}>
              {!isLogin && (
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
                  minLength={8}
                  required
                />
              </label>

              {error && <div className="error-message">{error}</div>}

              <button
                className="access-submit"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : isLogin
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>

            <div className="access-footer">
              Your interview data is securely associated with your account.
            </div>
          </div>
        </section>
      </main>

      <footer className="public-footer">
        <span>TECHPREP</span>

        <span>
          Built by <strong>Asish</strong> · © 2026
        </span>

        <span>Your preparation. Your evidence. Your next level.</span>
      </footer>
    </div>
  );
}

export default App;