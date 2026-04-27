package com.xperience.hero.service;

import com.xperience.hero.dto.CreateEventRequest;
import com.xperience.hero.dto.DashboardResponse;
import com.xperience.hero.entity.*;
import com.xperience.hero.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final InvitationRepository invitationRepository;
    private final RsvpRepository rsvpRepository;

    @Transactional
    public Event createEvent(UUID hostId, CreateEventRequest req) {
        User host = userRepository.findById(hostId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Host not found"));
        return eventRepository.save(Event.builder()
                .title(req.title())
                .description(req.description())
                .startTime(req.startTime())
                .location(req.location())
                .maxCapacity(req.maxCapacity())
                .host(host)
                .build());
    }

    @Transactional
    public void invitePeople(UUID eventId, UUID hostId, List<String> emails) {
        Event event = ownedByHost(eventId, hostId);
        for (String email : emails) {
            if (invitationRepository.findByEventAndEmail(event, email).isPresent()) continue;
            Invitation inv = invitationRepository.save(
                    Invitation.builder().event(event).email(email).build());
            rsvpRepository.save(Rsvp.builder().invitation(inv).build());
        }
    }

    @Transactional
    public Event cancelEvent(UUID eventId, UUID hostId) {
        Event event = ownedByHost(eventId, hostId);
        event.setStatus(EventStatus.CANCELLED);
        return eventRepository.save(event);
    }

    @Transactional
    public Event closeEvent(UUID eventId, UUID hostId) {
        Event event = ownedByHost(eventId, hostId);
        event.setStatus(EventStatus.CLOSED);
        return eventRepository.save(event);
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(UUID eventId, UUID hostId) {
        Event event = ownedByHost(eventId, hostId);
        List<Rsvp> rsvps = rsvpRepository.findByInvitation_Event(event);

        long confirmed  = rsvps.stream().filter(r -> r.getStatus() == RsvpStatus.CONFIRMED).count();
        long waitlisted = rsvps.stream().filter(r -> r.getStatus() == RsvpStatus.WAITLISTED).count();
        long maybe      = rsvps.stream().filter(r -> r.getResponse() == RsvpResponse.MAYBE).count();
        long declined   = rsvps.stream().filter(r -> r.getResponse() == RsvpResponse.NO).count();
        long pending    = rsvps.stream().filter(r -> r.getResponse() == null).count();

        List<DashboardResponse.AttendeeRow> attendees = rsvps.stream()
                .map(r -> new DashboardResponse.AttendeeRow(
                        r.getInvitation().getEmail(), r.getResponse(), r.getStatus()))
                .toList();

        return new DashboardResponse(event.getId(), event.getTitle(),
                confirmed, waitlisted, maybe, declined, pending, attendees);
    }

    private Event ownedByHost(UUID eventId, UUID hostId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        if (!event.getHost().getId().equals(hostId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return event;
    }
}
