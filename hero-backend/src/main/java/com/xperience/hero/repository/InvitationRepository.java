package com.xperience.hero.repository;

import com.xperience.hero.entity.Event;
import com.xperience.hero.entity.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InvitationRepository extends JpaRepository<Invitation, UUID> {
    Optional<Invitation> findByToken(UUID token);
    Optional<Invitation> findByEventAndEmail(Event event, String email);
    List<Invitation> findByEvent(Event event);
}
