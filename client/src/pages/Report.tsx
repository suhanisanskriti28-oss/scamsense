import { useState } from 'react';
import { apiUrl } from '../lib/api';

export default function ReportPage() {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/api/reports'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url, description })
      });
      if (!res.ok) throw new Error('Failed to submit report');
      setStatus('Report submitted successfully');
      setTitle('');
      setUrl('');
      setDescription('');
    } catch (err) {
      console.error(err);
      setStatus('Error submitting report');
    }
  };

  return (
    <main className="content-page report-page">
      <p className="eyebrow">Look out for one another</p>
      <h1>Share a report.</h1>
      <p>Help build a clearer picture of suspicious recruitment activity.</p>
      <form onSubmit={handleSubmit} className="content-form">
        <label htmlFor="report-title">Title</label>
        <input id="report-title" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
        <label htmlFor="report-url">URL</label>
        <input id="report-url" type="url" value={url} onChange={e => setUrl(e.target.value)} required />
        <label htmlFor="report-description">Description</label>
        <textarea id="report-description" value={description} onChange={e => setDescription(e.target.value)} required />
        <button className="button button-primary" type="submit">Submit report <span aria-hidden="true">↗</span></button>
      </form>
      {status && <p className="report-status" role="status">{status}</p>}
    </main>
  );
}
