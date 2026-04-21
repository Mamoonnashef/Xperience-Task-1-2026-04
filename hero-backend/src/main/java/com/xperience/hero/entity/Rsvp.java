package com.xperience.hero.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rsvps", schema = "hero")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Rsvp {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invitation_id", nullable = false, unique = true)
    private Invitation invitation;

    @Enumerated(EnumType.STRING)
    private RsvpResponse response;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RsvpStatus status = RsvpStatus.PENDING;

    private Instant respondedAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
