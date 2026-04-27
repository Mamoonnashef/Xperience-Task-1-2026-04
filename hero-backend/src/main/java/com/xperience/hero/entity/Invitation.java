package com.xperience.hero.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "invitations",
    schema = "hero",
    uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "email"})
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Invitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false, unique = true, updatable = false)
    private UUID token;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (token == null) token = UUID.randomUUID();
        createdAt = Instant.now();
    }
}
