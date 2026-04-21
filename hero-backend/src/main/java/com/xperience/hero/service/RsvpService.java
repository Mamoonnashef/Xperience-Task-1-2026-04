package com.xperience.hero.service;

import com.xperience.hero.dto.RsvpView;
import com.xperience.hero.entity.*;
import com.xperience.hero.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RsvpService {

    private final InvitationRepository invitationRepository;
    private final EventRepository eventRepository;
    private final RsvpRepository rsvpRepository;

    @Transactional(readOnly = true)
    public RsvpView getRsvp(UUID token) {
        Invitation inv = findByToken(token);
        Rsvp rsvp = rsvpRepository.findByInvitation(inv)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return toView(inv, rsvp);
    }

    @Transactional
    public RsvpView submitRsvp(UUID token, RsvpResponse response) {
        Invitation inv = findByToken(token);

        // Pessimistic lock on event row — capacity check and write are atomic
        Event event = eventRepository.findByIdWithLock(inv.getEvent().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (event.getStatus() != EventStatus.ACTIVE)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Event is not accepting RSVPs");

        // Request-time lock check — no scheduler dependency
        if (Instant.now().isAfter(event.getStartTime()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Event has started; RSVPs are locked");

        Rsvp rsvp = rsvpRepository.findByInvitation(inv)
                .orElseGet(() -> rsvpRepository.save(Rsvp.builder().invitation(inv).build()));

        RsvpStatus previousStatus = rsvp.getStatus();

        if (response == RsvpResponse.YES) {
            long confirmedExcludingSelf = rsvpRepository.countByInvitation_EventAndStatus(event, RsvpStatus.CONFIRMED)
                    - (previousStatus == RsvpStatus.CONFIRMED ? 1 : 0);
            boolean withinCapacity = event.getMaxCapacity() == null || confirmedExcludingSelf < event.getMaxCapacity();
            rsvp.setStatus(withinCapacity ? RsvpStatus.CONFIRMED : RsvpStatus.WAITLISTED);
        } else {
            // NO or MAYBE — does not hold a capacity slot
            rsvp.setStatus(RsvpStatus.PENDING);
            if (previousStatus == RsvpStatus.CONFIRMED) promoteWaitlisted(event);
        }

        if (rsvp.getRespondedAt() == null) rsvp.setRespondedAt(Instant.now());
        rsvp.setResponse(response);
        rsvpRepository.save(rsvp);

        return toView(inv, rsvp);
    }

    // Runs inside the same transaction as the No RSVP write
    private void promoteWaitlisted(Event event) {
        rsvpRepository.findFirstWaitlistedByEvent(event).ifPresent(r -> {
            r.setStatus(RsvpStatus.CONFIRMED);
            rsvpRepository.save(r);
        });
    }

    private Invitation findByToken(UUID token) {
        return invitationRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid link"));
    }

    private RsvpView toView(Invitation inv, Rsvp rsvp) {
        return new RsvpView(inv.getId(), inv.getEmail(),
                inv.getEvent().getTitle(), rsvp.getResponse(), rsvp.getStatus());
    }
}
