import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser, createEvent } from '../services/api';

export default function HomePage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [hostId, setHostId] = useState<string | null>(localStorage.getItem('hostId'));
  const [hostEmail, setHostEmail] = useState<string | null>(localStorage.getItem('hostEmail'));
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '', description: '', startTime: '', location: '', maxCapacity: '',
  });

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const user = await createUser(email);
      localStorage.setItem('hostId', user.id);
      localStorage.setItem('hostEmail', user.email);
      setHostId(user.id);
      setHostEmail(user.email);
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setError('');
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
    }
  }

  if (!hostId) {
    return (
      <div className="max-w-md mx-auto mt-24 p-8 bg-white rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-6">Event RSVP Manager</h1>
        <p className="text-gray-500 mb-4 text-sm">Enter your email to get started.</p>
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            className="w-full border rounded px-3 py-2"
            type="email" placeholder="your@email.com"
            value={email} onChange={e => setEmail(e.target.value)} required
          />
          <button className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700" type="submit">
            Continue
          </button>
        </form>
        {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-16 p-8 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create Event</h1>
        <span className="text-sm text-gray-400">{hostEmail}</span>
      </div>
      <form onSubmit={handleCreateEvent} className="space-y-4">
        <input className="w-full border rounded px-3 py-2" placeholder="Title" required
          value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <textarea className="w-full border rounded px-3 py-2" placeholder="Description (optional)" rows={3}
          value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <input className="w-full border rounded px-3 py-2" type="datetime-local" required
          value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
        <input className="w-full border rounded px-3 py-2" placeholder="Location" required
          value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
        <input className="w-full border rounded px-3 py-2" type="number" placeholder="Max capacity (optional)"
          value={form.maxCapacity} onChange={e => setForm(f => ({ ...f, maxCapacity: e.target.value }))} />
        <button className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700" type="submit">
          Create Event
        </button>
      </form>
      {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
    </div>
  );
}
