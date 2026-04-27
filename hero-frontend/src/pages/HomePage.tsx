import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser, createEvent } from '../services/api';
import Layout from '../components/Layout';

const inputCls = 'w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-400';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

export default function HomePage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [hostId, setHostId] = useState<string | null>(localStorage.getItem('hostId'));
  const [hostEmail, setHostEmail] = useState<string | null>(localStorage.getItem('hostEmail'));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', startTime: '', location: '', maxCapacity: '',
  });

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await createUser(email);
      localStorage.setItem('hostId', user.id);
      localStorage.setItem('hostEmail', user.email);
      setHostId(user.id);
      setHostEmail(user.email);
    } catch (err) {
      setError(String(err));
    } finally { setLoading(false); }
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const event = await createEvent(hostId!, {
        title: form.title,
        description: form.description,
        startTime: new Date(form.startTime).toISOString(),
        location: form.location,
        maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : null,
      });
      navigate(`/events/${event.id}`);
    } catch (err) {
      setError(String(err));
    } finally { setLoading(false); }
  }

  if (!hostId) {
    return (
      <Layout>
        <div className="max-w-sm mx-auto mt-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 mb-4">
              <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome</h1>
            <p className="text-slate-500 text-sm mt-1">Enter your email to host or manage events.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className={labelCls}>Email address</label>
                <input className={inputCls} type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button disabled={loading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition">
                {loading ? 'Please wait…' : 'Continue →'}
              </button>
            </form>
          </div>
          {error && <p className="mt-3 text-red-500 text-sm text-center">{error}</p>}
        </div>
      </Layout>
    );
  }

  return (
    <Layout email={hostEmail}>
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Create an Event</h1>
          <p className="text-slate-500 text-sm mt-1">Fill in the details below to get started.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleCreateEvent} className="space-y-5">
            <div>
              <label className={labelCls}>Event title</label>
              <input className={inputCls} placeholder="e.g. Team Lunch" required
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Description <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea className={inputCls + ' resize-none'} rows={3} placeholder="What's this event about?"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Date & time</label>
                <input className={inputCls} type="datetime-local" required
                  value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Max capacity <span className="text-slate-400 font-normal">(optional)</span></label>
                <input className={inputCls} type="number" min="1" placeholder="Unlimited"
                  value={form.maxCapacity} onChange={e => setForm(f => ({ ...f, maxCapacity: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input className={inputCls} placeholder="Address or online link" required
                value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <button disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition">
              {loading ? 'Creating…' : 'Create Event →'}
            </button>
          </form>
        </div>
        {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
      </div>
    </Layout>
  );
}
