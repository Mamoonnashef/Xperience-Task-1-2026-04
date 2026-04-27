import type { DashboardData, EventData, RsvpResponse, RsvpView, UserData } from '../types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export function createUser(email: string): Promise<UserData> {
  return request<UserData>(`/users?email=${encodeURIComponent(email)}`, { method: 'POST' });
}

export function createEvent(
  hostId: string,
  data: { title: string; description: string; startTime: string; location: string; maxCapacity: number | null }
): Promise<EventData> {
  return request<EventData>('/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Host-Id': hostId },
    body: JSON.stringify(data),
  });
}

export function invitePeople(eventId: string, hostId: string, emails: string[]): Promise<void> {
  return request<void>(`/events/${eventId}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Host-Id': hostId },
    body: JSON.stringify({ emails }),
  });
}

export function getDashboard(eventId: string, hostId: string): Promise<DashboardData> {
  return request<DashboardData>(`/events/${eventId}/dashboard`, {
    headers: { 'X-Host-Id': hostId },
  });
}

export function cancelEvent(eventId: string, hostId: string): Promise<EventData> {
  return request<EventData>(`/events/${eventId}/cancel`, {
    method: 'POST',
    headers: { 'X-Host-Id': hostId },
  });
}

export function closeEvent(eventId: string, hostId: string): Promise<EventData> {
  return request<EventData>(`/events/${eventId}/close`, {
    method: 'POST',
    headers: { 'X-Host-Id': hostId },
  });
}

export function getRsvp(token: string): Promise<RsvpView> {
  return request<RsvpView>(`/rsvp/${token}`);
}

export function submitRsvp(token: string, response: RsvpResponse): Promise<RsvpView> {
  return request<RsvpView>(`/rsvp/${token}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ response }),
  });
}
