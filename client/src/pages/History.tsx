import { useAuth } from '../context/auth';
import { useEffect, useState } from 'react';
import { apiUrl } from '../lib/api';
import './History.css';

function History() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [histRes, reportsRes] = await Promise.all([
          fetch(apiUrl('/api/history'), { credentials: 'include' }),
          fetch(apiUrl('/api/history/reports'), { credentials: 'include' })
        ]);
        if (!histRes.ok || !reportsRes.ok) {
          const response = !histRes.ok ? histRes : reportsRes;
          let message = `Unable to load your history (${response.status}).`;
          try {
            const data = await response.json();
            message = data.error || data.message || message;
          } catch {
            // Retain the HTTP status message if the response isn't JSON.
          }
          throw new Error(message);
        }
        const [histData, reportsData] = await Promise.all([histRes.json(), reportsRes.json()]);
        setAnalyses(histData.analyses || []);
        setReports(reportsData.reports || []);
      } catch (e) {
        setError(e instanceof TypeError
          ? 'Cannot reach the ScamSense API. Check that the server is running and try again.'
          : e instanceof Error
            ? e.message
            : 'Unable to load your history.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <main className="history-page"><p className="history-state">Loading your history…</p></main>;

  return (
    <main className="history-page">
      <header className="history-heading">
        <p className="eyebrow">Your saved checks</p>
        <h1>History, with context.</h1>
        <p>{user?.email ? `A record of your ScamSense activity for ${user.email}.` : 'Sign in to see your saved activity.'}</p>
      </header>
      {error && <p className="history-error" role="alert">{error}</p>}
      <section className="history-section">
        <h3>Analyses</h3>
        {analyses.length === 0 ? (
          <p className="history-empty">No analyses yet. Your completed checks will appear here.</p>
        ) : (
          <ul className="history-list">
            {analyses.map((a) => (
              <li key={a._id}>
                <div><strong>{new Date(a.createdAt).toLocaleString()}</strong><span>{a.riskLevel} signal level</span></div>
                <b>{a.score}<small>/100</small></b>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="history-section">
        <h3>Community Reports</h3>
        {reports.length === 0 ? (
          <p className="history-empty">No community reports submitted yet.</p>
        ) : (
          <ul className="history-list report-history-list">
            {reports.map((r) => (
              <li key={r._id}>
                <div><strong>{r.title}</strong><span>{new Date(r.createdAt).toLocaleString()}</span></div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default History;
