package com.xperience.hero.repository;

import com.xperience.hero.entity.Event;
import com.xperience.hero.entity.Invitation;
import com.xperience.hero.entity.Rsvp;
import com.xperience.hero.entity.RsvpStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RsvpRepository extends JpaRepository<Rsvp, UUID> {
    Optional<Rsvp> findByInvitation(Invitation invitation);
    List<Rsvp> findByInvitation_Event(Event event);
    List<Rsvp> findByInvitation_EventAndStatus(Event event, RsvpStatus status);
    long countByInvitation_EventAndStatus(Event event, RsvpStatus status);

    // FIFO promotion: oldest waitlisted RSVP by respondedAt
    @Query("SELECT r FROM Rsvp r WHERE r.invitation.event = :event AND r.status = 'WAITLISTED' ORDER BY r.respondedAt ASC")
    Optional<Rsvp> findFirstWaitlistedByEvent(@Param("event") Event event);
}
