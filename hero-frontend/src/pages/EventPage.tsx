import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDashboard, invitePeople, cancelEvent, closeEvent } from '../services/api';
import type { DashboardData } from '../types';

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const hostId = localStorage.getItem('hostId');

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [emails, setEmails] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!id || !hostId) return;
    try {
      setDashboard(await getDashboard(id, hostId));
    } catch (err) {
      setError(String(err));
    }
  }, [id, hostId]);

  useEffect(() => { load(); }, [load]);

  if (!hostId) {
    return <p className="text-center mt-16 text-gray-500">No host session. <a className="text-indigo-600" href="/">Go home</a></p>;
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setMessage('');
    const list = emails.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    try {
      await invitePeople(id!, hostId!, list);
      setEmails('');
      setMessage(`${list.length} invitation(s) sent.`);
      load();
    } catch (err) { setError(String(err)); }
  }

  async function handleCancel() {
    if (!confirm('Cancel this event?')) return;
    try { await cancelEvent(id!, hostId!); load(); } catch (err) { setError(String(err)); }
  }

  async function handleClose() {
    if (!confirm('Close this event to further responses?')) return;
    try { await closeEvent(id!, hostId!); load(); } catch (err) { setError(String(err)); }
  }

  return (
    <div className="max-w-2xl mx-auto mt-12 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{dashboard?.title ?? 'Event Dashboard'}</h1>
        <button onClick={() => navigate('/')} className="text-sm text-indigo-600">← New event</button>
      </div>

      {dashboard && (
        <div className="grid grid-cols-5 gap-3 text-center">
          {[
            { label: 'Confirmed', value: dashboard.confirmed, color: 'bg-green-100 text-green-800' },
            { label: 'Waitlisted', value: dashboard.waitlisted, color: 'bg-yellow-100 text-yellow-800' },
            { label: 'Maybe', value: dashboard.maybe, color: 'bg-blue-100 text-blue-800' },
            { label: 'Declined', value: dashboard.declined, color: 'bg-red-100 text-red-800' },
            { label: 'Pending', value: dashboard.pending, color: 'bg-gray-100 text-gray-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-lg p-3 ${color}`}>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs">{label}</div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleInvite} className="bg-white p-6 rounded-xl shadow space-y-3">
        <h2 className="font-semibold">Invite People</h2>
        <textarea className="w-full border rounded px-3 py-2 text-sm" rows={3}
          placeholder="Emails, one per line or comma-separated"
          value={emails} onChange={e => setEmails(e.target.value)} required />
        <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm" type="submit">
          Send Invitations
        </button>
        {message && <p className="text-green-600 text-sm">{message}</p>}
      </form>

      {dashboard && dashboard.attendees.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Response</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dashboard.attendees.map((a, i) => (
                <tr key={i}>
                  <td className="px-4 py-2">{a.email}</td>
                  <td className="px-4 py-2">{a.response ?? '—'}</td>
                  <td className="px-4 py-2 text-gray-500">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={handleClose} className="border border-gray-300 text-gray-600 px-4 py-2 rounded hover:bg-gray-50 text-sm">
          Close Event
        </button>
        <button onClick={handleCancel} className="border border-red-300 text-red-600 px-4 py-2 rounded hover:bg-red-50 text-sm">
          Cancel Event
        </button>
        <button onClick={load} className="ml-auto text-sm text-indigo-600">↻ Refresh</button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
