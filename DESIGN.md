# DESIGN.md — Event RSVP Manager

---

## Problem Statement

Hosts cannot collect, track, or enforce RSVPs for an event.

---

## Goals

- Host can create an event and invite people by email
- Invitees can respond Yes / No / Maybe via a unique link
- Capacity is enforced; overflow goes to a waitlist
- Waitlist promotes automatically when a confirmed attendee drops
- Host sees attendance counts and attendee list ("live" — definition open)
- Host can cancel or close the event
- RSVPs lock after event start time

## Non-Goals

- Notifications beyond the initial invitation (no cancellation alerts, reminders, or waitlist promotion notices)
- Invitee accounts or authentication
- Public event discovery
- Payment or ticketing
- Recurring events
- Host editing event details after invitations are sent

---

## Context and Constraints

### Technical
- Stack is fixed: Java 17, Spring Boot 4, Spring MVC, Spring Data JPA, PostgreSQL, React 19, TypeScript, Vite
- All other technical constraints (latency targets, platform limits, existing services) — unknown

### Product
- Each invitee receives a unique link; no account required is implied but not stated
- All other product constraints (tenant model, backward compatibility) — unknown

### Operational
- Unknown

### Organizational
- Unknown

---

## Facts, Assumptions, and Open Questions

### Confirmed Facts
- Event has: title, description, date/time, location, optional max-capacity
- Creator is the host
- Host invites people by email
- Each invitee gets a unique link
- Invitees respond Yes / No / Maybe
- Host sees attendance counts and attendee list
- Yes RSVPs overflow to waitlist when capacity is reached
- Waitlist promotes automatically when a confirmed attendee changes to No
- Host can cancel or close the event at any time
- Invitees can change RSVP before event starts
- All RSVPs lock after event start time

### Working Assumptions
- Unique link grants access without requiring an account

### Open Questions
- **How is the invitation link delivered?** — determines whether email infrastructure is in scope
- **Does Maybe count toward capacity?** — changes the RSVP state machine, capacity enforcement logic, waitlist trigger, and all concurrency scenarios involving the last slot
- **How is the host authenticated?** — shapes the trust and security model
- **What does "live" mean for the dashboard?** — polling, push, or refresh; materially affects the backend design
- **What happens to waitlisted attendees when the event is cancelled?** — affects correctness of the waitlist state
- **Can a closed event be re-opened?** — affects the event lifecycle state machine
- **Does cancellation notify invitees?** — determines whether a notification system is in scope
- **Can the host edit event details after invitations are sent?** — affects data consistency and invitee experience

---

## Actors and Workflows

### Actors
- **Host** — creates the event, invites people, monitors responses, controls event state
- **Invitee** — receives a unique link, submits and optionally changes their RSVP
- **System** — handles waitlist promotion and RSVP locking

### User-Facing Workflows

**Host creates event**
- Trigger: Host submits event creation form
- Steps: Enter title, description, date/time, location, optional capacity → submit
- State changes: Event created, host assigned
- Dependencies: Host authentication — open question

**Host invites people**
- Trigger: Host submits email list
- Steps: Enter emails → links generated → links delivered
- State changes: Invitations created
- Dependencies: Delivery mechanism — open question

**Invitee responds to RSVP**
- Trigger: Invitee opens unique link
- Steps: Open link → select Yes / No / Maybe → submit
- State changes: RSVP recorded; Yes + capacity reached → waitlist
- Dependencies: Event must be active and before start time

**Invitee changes RSVP**
- Trigger: Invitee reopens unique link
- Steps: Open link → change selection → submit
- State changes: RSVP updated; Yes → No may trigger waitlist promotion
- Dependencies: Before event start time; event not closed or cancelled

**Host views dashboard**
- Trigger: Host opens dashboard
- Steps: View counts and attendee list
- State changes: None
- Dependencies: "Live" mechanism — open question

**Host cancels or closes event**
- Trigger: Host selects cancel or close
- Steps: Select action → confirm
- State changes: Event state changes; further RSVPs blocked
- Dependencies: None stated

### Internal / Background Workflows

**Waitlist promotion**
- Trigger: Confirmed attendee changes RSVP to No
- Steps: Detect open slot → promote first waitlisted attendee to confirmed
- State changes: Waitlisted RSVP → confirmed
- Dependencies: Waitlist ordering — open question

**RSVP lock**
- Trigger: Event start time reached
- Steps: Lock all RSVPs for the event
- State changes: RSVPs become immutable
- Dependencies: Lock mechanism (scheduled job, request-time check, or both) — open question

### Failure Flows
- Not stated in the brief — all failure scenarios are open questions

---

## Invariants

### Business Invariants

**Confirmed count never exceeds max-capacity**
- Break scenario: Two simultaneous Yes RSVPs when one slot remains
- Trigger: Concurrent submissions read capacity as available before either writes
- Protection: Atomic check-and-write at DB level; application-level check alone is not enough

**Waitlist promotes only when a confirmed slot opens**
- Break scenario: Promotion fires while a new Yes RSVP simultaneously fills the same slot
- Trigger: Race between promotion logic and incoming Yes RSVP
- Protection: Promotion must be transactional and hold the slot across the check and the write

**RSVPs lock after event start time**
- Break scenario: Request submitted just before start time, processed after
- Trigger: Clock skew or processing delay
- Protection: Server-side time check at write time only; no client-side checks

**One RSVP per invitee per event**
- Break scenario: Duplicate submission via same unique link (retry, double-click)
- Trigger: Network retry or user error
- Protection: Unique constraint in the database; upsert semantics

### Data Integrity Invariants

**One unique link per invitee per event**
- Break scenario: Same email re-invited to the same event
- Trigger: Host submits duplicate email
- Protection: Unique constraint on (event, email)

**Event must have a start time**
- Break scenario: Event created without a start time
- Trigger: Missing or incomplete form submission
- Protection: Not-null constraint and input validation at creation

### Authorization Invariants

**Only the host can cancel or close the event**
- Break scenario: Another user submits a cancel or close request
- Trigger: Missing server-side authorization check; guessable event IDs
- Protection: Server-side authorization on every write; non-sequential event identifiers

**Only the holder of a unique link can submit that RSVP**
- Break scenario: Link guessed or brute-forced
- Trigger: Short or sequential token
- Protection: Cryptographically random tokens

### Concurrency Invariants

**Two simultaneous Yes RSVPs must not both confirm the last slot** ⚠ Currently protected only by hope
- Break scenario: Both requests read one slot available; both write confirmed
- Trigger: Concurrent submissions at capacity boundary
- Protection: Pessimistic lock, optimistic lock with retry, or DB-level atomic increment with ceiling check

**Waitlist promotion and new Yes must not fill the same slot**
- Break scenario: Promotion and incoming Yes both claim the slot opened by a No
- Trigger: Concurrent promotion trigger and new RSVP submission
- Protection: Promotion must execute within the same transaction as the slot release

### Tenant Isolation Invariants
- Unknown — tenant model not stated; no control can be designed yet

---

## Proposed Architecture

### Components

**React SPA**
- Responsibility: Renders three surfaces — event creation form (host), attendance dashboard (host), RSVP response page (invitee)
- Inputs: User actions, API responses
- Outputs: HTTP requests to backend API
- Ownership: Frontend
- Notes: Owns no business logic. Enforces no invariants. All state lives in the backend.

**Spring Boot API**
- Responsibility: Handles all HTTP requests; enforces all business rules — capacity, waitlist promotion, RSVP locking, event lifecycle transitions, authorization
- Inputs: HTTP requests from React SPA (host flows), HTTP requests via unique link (invitee flows)
- Outputs: JSON responses to frontend; reads and writes to PostgreSQL
- Ownership: Backend
- Notes: All invariants are enforced here or at the database, never in the frontend. Host authentication mechanism is an open question.

**System Flow Handler** ⚠ Mechanism unresolved
- Responsibility: Triggers RSVP lock at event start time and waitlist promotion on RSVP change
- Inputs: Event start time, RSVP state change events
- Outputs: Updated RSVP and event state in PostgreSQL
- Ownership: Backend
- Notes: Could be a background scheduler, a request-time check, or both. This is an explicit open decision — calling it part of the API hides two different execution models.

**PostgreSQL**
- Responsibility: Persists all state; enforces structural constraints; provides transaction isolation for concurrency invariants
- Inputs: Reads and writes from Spring Boot API
- Outputs: Consistent state under concurrent access
- Ownership: Database
- Notes: Unique constraints on (event, email) and (event, invitee). Locking primitive for atomic capacity check-and-write must be resolved at this layer.

### Interaction Summary

Host flows are authenticated (mechanism unknown) and routed through the Spring Boot API, which enforces authorization before any state change. Invitee flows are gated solely by the unique link token — no account required. All business rules, including capacity enforcement and waitlist promotion, execute in the backend within a single transaction boundary; the frontend receives only the outcome.

System flows — RSVP locking and waitlist promotion — are currently unresolved in execution model. Whether they execute as a background scheduler or as request-time checks determines whether the backend is a single request-response component or has a second execution path. This decision is deferred and marked open.

---

## Data Ownership and State Model

**Event**
- Source of truth: PostgreSQL
- Mutated by: Host (create, cancel, close); System (lock at start time — mechanism open)
- Read by: Host (dashboard); System (lock enforcement, capacity check)
- Derived state: Whether event status is a stored field or derived from timestamps is an open decision
- Lifecycle: Created → Active → Closed / Cancelled; locked implicitly at start time
- Correctness risk: Host and System both mutate event state — no stated conflict resolution rule

**Invitation**
- Source of truth: PostgreSQL
- Mutated by: Host (creates record); System (generates and stores unique token)
- Read by: System (resolves unique link to invitee identity on each request)
- Derived state: None
- Lifecycle: Created on invite; no stated expiry or revocation rule
- Correctness risk: No stated constraint prevents re-inviting the same email; duplicate links possible without a unique constraint on (event, email)

**RSVP**
- Source of truth: PostgreSQL
- Mutated by: Invitee (submit, change); System (lock at start time, waitlist promotion)
- Read by: Host (dashboard); Invitee (current response via unique link); System (capacity check, promotion trigger)
- Derived state: Whether "confirmed" is a stored field or derived from (Yes + below capacity + not waitlisted) is unresolved — this is the deepest ownership blur in the model
- Lifecycle: Created on first response → Updated on change → Locked at event start time
- Correctness risk: Two actors mutate RSVP (invitee and system); no conflict resolution rule stated; duplicate write possible on retry without upsert semantics

**Waitlist Position**
- Source of truth: Unknown — could be a stored field or derived from submission timestamp ordering
- Mutated by: System (on promotion)
- Read by: System (to determine next promotee)
- Derived state: Open question — ordering rule (FIFO by timestamp or explicit position) not stated
- Lifecycle: Assigned when Yes RSVP overflows capacity; released on promotion or event cancellation
- Correctness risk: Two simultaneous No RSVPs could trigger two promotions into one slot if promotion is not transactional

**Attendance Counts**
- Source of truth: Derived entirely from RSVP states — no independent storage stated
- Mutated by: Nobody directly; changes when RSVPs change
- Read by: Host (dashboard)
- Derived state: Yes — entirely computed; stale if cached separately from RSVPs
- Lifecycle: Reflects current RSVP state at read time
- Correctness risk: If cached for dashboard performance, cache becomes a second source of truth; staleness window undefined

---

## Trust Boundaries and Security Notes

### Trust Entry Points
- **Host**: enters via authentication — mechanism unknown; all privileged operations depend on this being resolved; if host identity is passed as a request parameter rather than derived from a verified session, any caller can impersonate any host
- **Invitee**: enters via unique link token only — token must be validated on every RSVP write, not just on first page load; a replayed or stolen token submits unchallenged if re-validation is absent
- **System flows**: internal only — if RSVP locking or waitlist promotion is ever exposed as an HTTP endpoint, nothing in this design prevents an external caller from triggering it directly

### Authorization Enforcement
- Cancel or close event — host only; enforced server-side
- Invite people — host only; enforced server-side
- Submit or change RSVP — token holder only; token re-validated on every write
- RSVP lock and waitlist promotion — system only; must not be externally callable
- Waitlist promotion is triggered by an invitee action (Yes → No); the boundary between invitee-triggered and system-executed must be explicit — promotion is a consequence, not a directly callable operation
- Event cancellation does not revoke tokens — backend must check event state on every RSVP write or a cancelled event silently accepts further submissions

### Tenant Isolation
- Tenant model not stated — no isolation controls can be designed yet
- IDOR risk: if event identifiers are sequential or guessable, cross-event access is possible; non-sequential identifiers required

### Sensitive Data / Privileged Operations
- **Email addresses**: PII; collected from host, stored against invitations; who can read them beyond the host is not stated
- **Unique link tokens**: grant RSVP access; must be cryptographically random; not revoked on event cancellation
- **RSVP responses**: visibility beyond the host is not stated
- **Privileged operations**: event state transitions (cancel, close), invitation creation, RSVP lock, waitlist promotion — all require explicit server-side enforcement; the frontend is untrusted

---

## Concurrency and Correctness Notes

| Workflow / State | Risk | What Can Go Wrong | Control Note |
|---|---|---|---|
| Invitee submits RSVP | Duplicate request | Duplicate RSVP row; count inflated | Unique constraint + upsert |
| Host invites people | Duplicate invitation | Two tokens for same invitee at same event | Unique constraint on (event, email) |
| RSVP lock job | Double execution | Second state transition on already-locked RSVP | Idempotency — lock is a no-op if already locked |
| Two simultaneous Yes RSVPs at capacity | Concurrent update | Confirmed count exceeds capacity | Transaction wrapping capacity check and RSVP write; atomic check-and-write |
| Two simultaneous No RSVPs | Concurrent promotion | Two waitlisted attendees promoted into one slot | Transaction wrapping No write and promotion together |
| Promotion races incoming Yes RSVP | Concurrent update | Same slot claimed twice | Promotion must execute within the No RSVP transaction; not a separate operation |
| Host cancels while invitee submits | Interleaved writes | RSVP written against cancelled event | Event state check inside the same transaction as the RSVP write |
| Capacity check before RSVP write | Stale read | Check passes; write violates capacity | Check and write must be one atomic operation |
| RSVP lock check before RSVP write | Stale read | RSVP written after lock should apply | Event start time check inside the same transaction as the RSVP write |
| RSVP lock via scheduled job | Timing dependency | RSVPs accepted past event start time if job is late ⚠ timing luck | Request-time check is the real gate; scheduler alone is insufficient |
| Promotion after event cancellation | Out-of-order event | Waitlisted attendee confirmed into cancelled event | Event state check inside promotion transaction |
| In-flight promotion invisible to concurrent capacity check | Stale read | Slot counted open while promotion is already claiming it | Promotion and capacity check must share the same transaction boundary |

---

## Scalability and Multi-Tenancy Notes

### Growth Axes
- RSVP submissions: bursty, concentrated when a popular event opens and just before it starts
- Dashboard reads: grow with active host count and polling frequency — both unresolved
- Background work: one lock job execution per event at start time; one promotion per confirmed-to-No change; both scale with active event count
- Data growth: bounded per event — one invitation and one RSVP per invitee; grows linearly with host and event count; no stated upper bound on invitees per event
- Tenant growth: no tenant model stated; no growth axis can be defined

### Likely First Bottlenecks
- **Capacity check row lock**: every Yes RSVP for the same event acquires a lock on the same row; transactions queue behind each other; throughput degrades to one confirmed RSVP per transaction commit cycle; adding backend instances does not help — contention is in the database
- **Dashboard read competing with RSVP writes**: the count query runs against the same rows that concurrent RSVP writes are locking; under a burst of submissions, reads wait behind write locks or read stale state
- **Lock job processing events sequentially**: if many events start within the same scheduler tick, they are processed one by one; the last event is locked late; RSVPs are accepted past start time until the job reaches it

### Current Sufficiency
- Single PostgreSQL instance is sufficient for small event and host counts
- Single Spring Boot instance is sufficient for low concurrent request volume
- No caching, queuing, or additional infrastructure needed at this scale

### Future Redesign Triggers
- A popular event with many simultaneous RSVP submissions exposes the row-lock bottleneck — this requires a different capacity enforcement strategy, not more instances
- Dashboard latency complaints would require replacing polling with a push mechanism
- Lock job lag under many simultaneous event starts would require parallel or distributed job execution

### Tenant / Noisy-Neighbor Notes
- No tenant model exists; all events share a single schema with no isolation boundary
- A single large event hammering the capacity row lock slows confirmed RSVP throughput for all concurrent events in the same database — noisy-neighbor effect exists today, unnamed and unmitigated
- Adding multi-tenant isolation later is a schema and authorization change that touches every query; deferring this decision is a deliberate assumption, not a free choice

---

## Risks and Failure Notes

| Risk | Failure Shape | Cause | Note |
|---|---|---|---|
| Capacity race under concurrent Yes RSVPs | Event goes over capacity; both submissions confirm the last slot | No atomic control between capacity check and RSVP write | Core feature fails silently; no error surfaced to either invitee |
| Double waitlist promotion | One slot, two confirmed attendees | Two No RSVPs fire two promotion transactions with no shared boundary | Arises from promotion having no stated transaction boundary around the No write and the promotion |
| RSVP lock depends on scheduler timing | RSVPs accepted past event start time | Scheduler fires late or fails; no request-time fallback exists | The invariant "RSVPs lock at start time" is visibly broken on the first real event; most naive failure in production |
| Email is the sole invitee entry point | Invitee never receives unique link; cannot participate | Email delivery fails; no retry, resend, or fallback stated | Entire invitee flow has one silent point of failure |
| Promotion fails silently | Slot sits empty; waitlisted attendee never moved | Promotion transaction fails with no alerting, retry, or recovery | Arises from System Flow Handler having no stated failure handling |
| "Maybe counts toward capacity" assumption is wrong | Capacity enforcement, waitlist trigger, and all concurrency scenarios at the boundary change shape | Assumption is unresolved; the state machine is built on it | If wrong, the design requires structural revision before implementation |

---

## Alternatives Considered

### Alternative 1: SELECT FOR UPDATE + request-time lock check
Replace the scheduler with an event start time check on every RSVP write. Keep pessimistic row locking for capacity. Promotion remains synchronous inside the No RSVP transaction.
- Correctness: closes the scheduler timing gap; lock invariant enforced by the same code path that writes RSVPs
- Complexity: minimal change from proposed; removes one failure surface
- Operational burden: lower — no scheduler to monitor or recover
- Scalability: row lock contention unchanged
- Not chosen: requires explicit decision on scheduler removal — currently deferred

### Alternative 2: Optimistic concurrency on confirmed count + request-time lock check
Replace the row lock with a version check on the event's confirmed count. Losing transaction retries. Scheduler replaced by request-time check.
- Correctness: strong — conflict surfaces at write time; no silent over-confirmation
- Complexity: retry logic required; conflict detection must be explicit
- Operational burden: lower — no scheduler; retry is self-contained
- Scalability: writers do not queue behind a lock; retry rate increases under high contention
- Not chosen: retry logic adds implementation complexity not yet justified by stated scale requirements

## Tradeoffs in Chosen Design

- Row lock serializes all Yes RSVP writes for the same event through a single database lock — this is acceptable only if events are small; no upper bound on event size is stated, making this an implicit assumption
- Scheduler as sole RSVP lock gate introduces a timing-dependent correctness risk with no fallback — simplest implementation, weakest invariant
- Synchronous promotion inside the No RSVP transaction is correct but makes every No RSVP write slower by the cost of the promotion query
- Pessimistic locking is the simplest mental model for capacity enforcement but trades per-event throughput for correctness
- Single PostgreSQL instance is operationally simple but is a single point of failure with no stated mitigation

---

## Rollout / Migration Notes

1. Schema must be created before the backend starts — tables must exist before any request is served; migration tooling not stated (open decision)
2. Backend must be healthy before frontend is deployed — frontend has no API to call otherwise
3. Email delivery must be configured and verified before any invitation can be sent — misconfiguration fails silently; no stated health check
4. Scheduler must be verified as running at startup — no stated check; silent failure means RSVPs never lock
5. **Scheduler does not catch up after downtime** — if the application is down when an event's start time passes, the lock job never fires for that event; on restart, Spring's scheduler has no built-in catch-up; events that started during downtime have unlocked RSVPs indefinitely; this is a correctness gap, not an ops detail
6. If deployment fails after schema migration runs, new tables exist without the application — no rollback procedure stated
7. No feature flags or gradual rollout — this is a full cutover; all users see the feature or none do
