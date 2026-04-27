import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getRsvp, submitRsvp } from '../services/api';
import type { RsvpResponse, RsvpView } from '../types';
import Layout from '../components/Layout';

const OPTIONS: { value: RsvpResponse; label: string; icon: string; selected: string; idle: string }[] = [
  {
    value: 'YES', label: "Yes, I'll be there", icon: '✓',
    selected: 'bg-emerald-600 border-emerald-600 text-white',
    idle: 'bg-white border-slate-200 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50',
  },
  {
    value: 'MAYBE', label: 'Maybe', icon: '~',
    selected: 'bg-sky-500 border-sky-500 text-white',
    idle: 'bg-white border-slate-200 text-slate-700 hover:border-sky-400 hover:bg-sky-50',
  },
  {
    value: 'NO', label: "No, I can't make it", icon: '✕',
    selected: 'bg-rose-500 border-rose-500 text-white',
    idle: 'bg-white border-slate-200 text-slate-700 hover:border-rose-400 hover:bg-rose-50',
  },
];

const STATUS_MSG: Partial<Record<RsvpView['status'], { text: string; cls: string }>> = {
  CONFIRMED:  { text: 'Your spot is confirmed.', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  WAITLISTED: { text: "You're on the waitlist. You'll be confirmed if a spot opens.", cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  LOCKED:     { text: 'This event has started. RSVPs are locked.', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export default function RsvpPage() {
  const { token } = useParams<{ token: string }>();
  const [rsvp, setRsvp] = useState<RsvpView | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    getRsvp(token).then(setRsvp).catch(err => setError(String(err)));
  }, [token]);

  async function handleSelect(response: RsvpResponse) {
    if (!token) return;
    setSubmitting(true); setError('');
    try { setRsvp(await submitRsvp(token, response)); }
    catch (err) { setError(String(err)); }
    finally { setSubmitting(false); }
  }

  if (error) return (
    <Layout>
      <div className="max-w-sm mx-auto mt-24 text-center">
        <p className="text-rose-500 text-sm">{error}</p>
      </div>
    </Layout>
  );

  if (!rsvp) return (
    <Layout>
      <div className="max-w-sm mx-auto mt-24 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
    </Layout>
  );

  const isLocked = rsvp.status === 'LOCKED';
  const statusMsg = STATUS_MSG[rsvp.status];

  return (
    <Layout>
      <div className="max-w-sm mx-auto mt-12">
        {/* Event card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-indigo-600 px-6 py-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-3">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">{rsvp.eventTitle}</h1>
            <p className="text-indigo-200 text-sm mt-1">{rsvp.email}</p>
          </div>

          <div className="p-6 space-y-3">
            {statusMsg && (
              <div className={`rounded-lg border px-4 py-3 text-sm ${statusMsg.cls}`}>
                {statusMsg.text}
              </div>
            )}

            {!isLocked && (
              <>
                <p className="text-sm text-slate-500 text-center">
                  {rsvp.response ? 'Update your response:' : 'Will you be attending?'}
                </p>
                {OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    disabled={submitting}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition
                      ${rsvp.response === opt.value ? opt.selected : opt.idle}
                      disabled:opacity-50`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border
                      ${rsvp.response === opt.value ? 'bg-white/20 border-white/30 text-white' : 'border-slate-300 text-slate-400'}`}>
                      {opt.icon}
                    </span>
                    {opt.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {error && <p className="mt-3 text-rose-500 text-sm text-center">{error}</p>}
      </div>
    </Layout>
  );
}
