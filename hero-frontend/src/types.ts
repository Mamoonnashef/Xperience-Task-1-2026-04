export type EventStatus = 'ACTIVE' | 'CLOSED' | 'CANCELLED';
export type RsvpResponse = 'YES' | 'NO' | 'MAYBE';
export type RsvpStatus = 'PENDING' | 'CONFIRMED' | 'WAITLISTED' | 'LOCKED';

export interface EventData {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  location: string;
  maxCapacity: number | null;
  status: EventStatus;
}

export interface AttendeeRow {
  email: string;
  response: RsvpResponse | null;
  status: RsvpStatus;
}

export interface DashboardData {
  eventId: string;
  title: string;
  confirmed: number;
  waitlisted: number;
  maybe: number;
  declined: number;
  pending: number;
  attendees: AttendeeRow[];
}

export interface RsvpView {
  invitationId: string;
  email: string;
  eventTitle: string;
  response: RsvpResponse | null;
  status: RsvpStatus;
}

export interface UserData {
  id: string;
  email: string;
}
