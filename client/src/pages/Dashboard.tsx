import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { apiUrl } from '../lib/api';
import './Dashboard.css';

type Evidence = {
  id: string;
  severity: number;
  weight: number;
  matchedText: string;
  explanation: string;
};

type AnalysisResult = {
  score: number;
  riskLevel: string;
  evidence: Evidence[];
  entities: {
    emails?: string[];
    phones?: string[];
    urls?: string[];
    amounts?: string[];
    company?: string | null;
  };
  domainInfo?: {
    hostname?: string;
    mx?: string[] | null;
    age?: string | null;
  };
  analysisId: string;
};

function getErrorMessage(response: Response) {
  return response.json()
    .then((data) => data.error || data.message || `Analysis failed (${response.status}).`)
    .catch(() => `Analysis failed (${response.status}). The server returned an unreadable response.`);
}

function Dashboard() {
  const { user } = useAuth();
  const [analysisText, setAnalysisText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!analysisText.trim()) {
      setError('Paste the offer, message, or job description you want to review.');
      return;
    }
    if (!user) {
      setError('Sign in or create a free account before analysing. Your results are saved to your history.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/analysis/analyze'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: analysisText.trim() }),
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));

      const data: AnalysisResult = await response.json();
      if (
        typeof data.score !== 'number' ||
        typeof data.riskLevel !== 'string' ||
        !Array.isArray(data.evidence)
      ) {
        throw new Error('The analysis service returned an incomplete result. Please try again.');
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof TypeError
        ? 'Cannot reach the ScamSense API. Check that the server is running and try again.'
        : err instanceof Error
          ? err.message
          : 'Unable to analyse this offer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const riskClass = result?.riskLevel.toLowerCase() ?? 'low';

  return (
    <main className="dashboard-page">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> Clarity before commitment</p>
          <h1>Trust the opportunity.<br /><em>Verify the offer.</em></h1>
          <p className="hero-description">
            A job offer should open a door, not ask you to take a leap in the dark.
            Check the details, spot common warning signs, and decide with more confidence.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#analyze">Analyse an Offer <span aria-hidden="true">↗</span></a>
            <Link className="button button-quiet" to="/history">Explore Reports <span aria-hidden="true">→</span></Link>
          </div>
          <div className="hero-note">
            <span className="note-mark">S</span>
            <span>Evidence-led signals.<br /><strong>No verdicts without context.</strong></span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orb orb-large" />
          <div className="orb orb-small" />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-seal"><span>SCAM</span><strong>SENSE</strong><i>✳</i></div>
          <div className="signal-chip chip-top"><span /> Verify the sender</div>
          <div className="signal-chip chip-bottom">◈ &nbsp;Read the signals</div>
        </div>
      </section>

      <section className="analysis-section" id="analyze">
        <div className="section-heading">
          <p className="eyebrow">Your first read</p>
          <h2>What did they send you?</h2>
          <p>Paste the full job description, recruiter message, email, or offer text. More context helps surface relevant signals.</p>
        </div>
        <form className="analysis-card" onSubmit={handleSubmit}>
          <label htmlFor="offer-text">Offer or message</label>
          <textarea
            id="offer-text"
            placeholder="Paste the complete message here — including sender details, payment requests, links, and the role description…"
            value={analysisText}
            onChange={(event) => setAnalysisText(event.target.value)}
            rows={10}
            required
          />
          <div className="analysis-form-footer">
            <p>Your text is assessed for known signals, not against a complete registry of employers.</p>
            <button className="button button-primary analyze-button" type="submit" disabled={loading}>
              {loading ? <><span className="loading-spinner" /> Analysing…</> : 'Analyse offer'} {!loading && <span aria-hidden="true">↗</span>}
            </button>
          </div>
          {!user && (
            <p className="login-hint">
              Sign in to save your checks. <Link to="/login">Sign in</Link> or <Link to="/register">create an account</Link>.
            </p>
          )}
          {error && <div className="analysis-error" role="alert">{error}</div>}
        </form>

        {result && (
          <section className={`result-panel risk-${riskClass}`} aria-live="polite" aria-labelledby="result-title">
            <div className="result-heading">
              <div>
                <p className="eyebrow">Your evidence summary</p>
                <h2 id="result-title">Offer assessment</h2>
              </div>
              <span className="result-id">Saved to your history</span>
            </div>
            <div className="result-overview">
              <div className="risk-gauge" style={{
                background: `conic-gradient(var(--risk-color) ${Math.max(0, Math.min(result.score, 100)) * 3.6}deg, rgba(245, 239, 224, .12) 0deg)`,
              }}>
                <div className="gauge-center">
                  <strong>{result.score}</strong>
                  <span>out of 100</span>
                </div>
              </div>
              <div className="risk-summary">
                <span className="risk-kicker">Signal-based risk</span>
                <strong className="risk-label">{result.riskLevel} risk</strong>
                <p>
                  {result.evidence.length
                    ? `${result.evidence.length} signal${result.evidence.length === 1 ? '' : 's'} matched in the text you shared.`
                    : 'No predefined warning signals matched in the text you shared. This is not proof that the offer is legitimate.'}
                </p>
              </div>
            </div>

            <div className="result-columns">
              <div className="evidence-column">
                <h3>Detected signals <span>{result.evidence.length}</span></h3>
                {result.evidence.length ? (
                  <div className="evidence-list">
                    {result.evidence.map((item) => (
                      <article className="evidence-card" key={item.id}>
                        <div className="evidence-card-top">
                          <strong>{item.id.replaceAll('-', ' ')}</strong>
                          <span>+{item.weight * item.severity} points</span>
                        </div>
                        <p className="matched-phrase">“{item.matchedText}”</p>
                        <p>{item.explanation}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty-evidence">
                    <span>✓</span>
                    <p>No known warning phrases were detected. Review the offer independently before sharing personal or financial information.</p>
                  </div>
                )}
              </div>
              <aside className="verification-card">
                <h3>Domain details</h3>
                {result.domainInfo?.hostname ? (
                  <>
                    <p className="domain-name">{result.domainInfo.hostname}</p>
                    <div className="domain-check">
                      <span>Mail records</span>
                      <strong>{result.domainInfo.mx === null ? 'Could not verify' : result.domainInfo.mx?.length ? 'Found' : 'None found'}</strong>
                    </div>
                    <div className="domain-check">
                      <span>Registration date</span>
                      <strong>{result.domainInfo.age ? new Date(result.domainInfo.age).toLocaleDateString() : 'Unavailable'}</strong>
                    </div>
                  </>
                ) : (
                  <p className="domain-unavailable">No sender domain or link was available to check in the submitted text.</p>
                )}
                <p className="verification-limit">
                  Domain checks provide context only; they do not verify that a company or recruiter is genuine.
                </p>
              </aside>
            </div>
            <div className="next-steps">
              <h3>A few careful next steps</h3>
              <ul>
                <li>Contact the company through its official website or a verified phone number.</li>
                <li>Never pay to apply, interview, receive equipment, or secure a job.</li>
                <li>Don’t share identity or banking details until you independently verify the sender.</li>
              </ul>
            </div>
          </section>
        )}
      </section>

      <footer className="dashboard-footer">
        <span>ScamSense</span>
        <p>A second look can make all the difference.</p>
        <Link to="/report">Share a report <span aria-hidden="true">↗</span></Link>
      </footer>
    </main>
  );
}

export default Dashboard;
