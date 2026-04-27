import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDashboard, invitePeople, cancelEvent, closeEvent } from '../services/api';
import type { DashboardData, RsvpResponse, RsvpStatus } from '../types';
import Layout from '../components/Layout';

const STAT_CONFIG = [
  { key: 'confirmed',  label: 'Confirmed',  bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  { key: 'waitlisted', label: 'Waitlisted', bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
  { key: 'maybe',      label: 'Maybe',      bg: 'bg-sky-50',     text: 'text-sky-700',     dot: 'bg-sky-500'     },
  { key: 'declined',   label: 'Declined',   bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-500'    },
  { key: 'pending',    label: 'Pending',    bg: 'bg-slate-50',   text: 'text-slate-500',   dot: 'bg-slate-400'   },
] as const;

const RESPONSE_LABEL: Record<string, string> = { YES: 'Yes', NO: 'No', MAYBE: 'Maybe' };
const STATUS_BADGE: Record<RsvpStatus, string> = {
  CONFIRMED:  'bg-emerald-100 text-emerald-700',
  WAITLISTED: 'bg-amber-100 text-amber-700',
  LOCKED:     'bg-slate-100 text-slate-500',
  PENDING:    'bg-slate-100 text-slate-400',
};
const RESPONSE_BADGE: Record<string, string> = {
  YES: 'text-emerald-600 font-medium', NO: 'text-rose-500', MAYBE: 'text-sky-600',
};

function Badge({ status }: { status: RsvpStatus }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[status]}`}>{status}</span>;
}

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const hostId = localStorage.getItem('hostId');
  const hostEmail = localStorage.getItem('hostEmail');

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [emails, setEmails] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id || !hostId) return;
    try { setDashboard(await getDashboard(id, hostId)); }
    catch (err) { setError(String(err)); }
  }, [id, hostId]);

  useEffect(() => { load(); }, [load]);

  if (!hostId) return (
    <Layout>
      <p className="text-center mt-16 text-slate-500">
        No host session. <a className="text-indigo-600 underline" href="/">Go home</a>
      </p>
    </Layout>
  );

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    const list = emails.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    try {
      await invitePeople(id!, hostId!, list);
      setEmails('');
      setMessage(`${list.length} invitation(s) sent.`);
      load();
    } catch (err) { setError(String(err)); }
    finally { setLoading(false); }
  }

  async function handleCancel() {
    if (!confirm('Cancel this event? This cannot be undone.')) return;
    try { await cancelEvent(id!, hostId!); load(); } catch (err) { setError(String(err)); }
  }

  async function handleClose() {
    if (!confirm('Close this event to further responses?')) return;
    try { await closeEvent(id!, hostId!); load(); } catch (err) { setError(String(err)); }
  }

  return (
    <Layout email={hostEmail}>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button onClick={() => navigate('/')} className="text-xs text-slate-400 hover:text-indigo-600 mb-2 flex items-center gap-1">
              ← New event
            </button>
            <h1 className="text-2xl font-bold text-slate-800">{dashboard?.title ?? '—'}</h1>
            {dashboard && (
              <span className={`mt-1 inline-block text-xs font-medium px-2.5 py-0.5 rounded-full
                ${dashboard.confirmed >= 0 && dashboard?.title
                  ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                ACTIVE
              </span>
            )}
          </div>
          <button onClick={load} className="text-slate-400 hover:text-indigo-600 text-sm" title="Refresh">↻ Refresh</button>
        </div>

        {/* Stats */}
        {dashboard && (
          <div className="grid grid-cols-5 gap-3">
            {STAT_CONFIG.map(({ key, label, bg, text, dot }) => (
              <div key={key} className={`rounded-xl p-4 ${bg}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className={`text-xs font-medium ${text}`}>{label}</span>
                </div>
                <div className={`text-3xl font-bold ${text}`}>{dashboard[key]}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Invite form */}
          <div className="col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-semibold text-slate-800 mb-3">Invite People</h2>
              <form onSubmit={handleInvite} className="space-y-3">
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
                  rows={5} placeholder={"alice@example.com\nbob@example.com"}
                  value={emails} onChange={e => setEmails(e.target.value)} required />
                <button disabled={loading} type="submit"
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition">
                  {loading ? 'Sending…' : 'Send Invitations'}
                </button>
              </form>
              {message && <p className="mt-2 text-emerald-600 text-xs">{message}</p>}
            </div>
          </div>

          {/* Attendee table */}
          <div className="col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {dashboard && dashboard.attendees.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs text-slate-500 uppercase tracking-wide">
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Response</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dashboard.attendees.map((a, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-2.5 text-slate-700">{a.email}</td>
                        <td className={`px-4 py-2.5 ${a.response ? RESPONSE_BADGE[a.response as RsvpResponse] : 'text-slate-300'}`}>
                          {a.response ? RESPONSE_LABEL[a.response] : '—'}
                        </td>
                        <td className="px-4 py-2.5"><Badge status={a.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-16 text-center text-slate-400 text-sm">
                  No attendees yet. Send invitations to get started.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={handleClose}
            className="border border-slate-300 text-slate-600 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 transition">
            Close Event
          </button>
          <button onClick={handleCancel}
            className="border border-rose-300 text-rose-600 px-4 py-2 rounded-lg text-sm hover:bg-rose-50 transition">
            Cancel Event
          </button>
        </div>

        {error && <p className="text-rose-500 text-sm">{error}</p>}
      </div>
    </Layout>
  );
}
