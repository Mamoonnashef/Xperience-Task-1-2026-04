import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getRsvp, submitRsvp } from '../services/api';
import type { RsvpResponse, RsvpView } from '../types';

const LABELS: Record<RsvpResponse, string> = { YES: 'Yes, I\'ll be there', NO: 'No, I can\'t make it', MAYBE: 'Maybe' };

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
    try {
      setRsvp(await submitRsvp(token, response));
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return (
    <div className="max-w-md mx-auto mt-24 text-center">
      <p className="text-red-500">{error}</p>
    </div>
  );

  if (!rsvp) return (
    <div className="max-w-md mx-auto mt-24 text-center text-gray-400">Loading…</div>
  );

  const isLocked = rsvp.status === 'LOCKED';

  return (
    <div className="max-w-md mx-auto mt-24 p-8 bg-white rounded-xl shadow text-center">
      <h1 className="text-xl font-bold mb-1">{rsvp.eventTitle}</h1>
      <p className="text-gray-400 text-sm mb-8">Invited as {rsvp.email}</p>

      {isLocked ? (
        <p className="text-gray-500">This event has started. RSVPs are locked.</p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 mb-4">
            {rsvp.response ? `Your current response: ${rsvp.response}` : 'You haven\'t responded yet.'}
          </p>
          {(['YES', 'NO', 'MAYBE'] as RsvpResponse[]).map(r => (
            <button
              key={r}
              disabled={submitting}
              onClick={() => handleSelect(r)}
              className={`w-full py-3 rounded-lg border text-sm font-medium transition
                ${rsvp.response === r
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'}`}
            >
              {LABELS[r]}
            </button>
          ))}
        </div>
      )}

      {rsvp.status === 'WAITLISTED' && (
        <p className="mt-4 text-sm text-yellow-600">You are on the waitlist.</p>
      )}
      {rsvp.status === 'CONFIRMED' && (
        <p className="mt-4 text-sm text-green-600">Your spot is confirmed.</p>
      )}
    </div>
  );
}
