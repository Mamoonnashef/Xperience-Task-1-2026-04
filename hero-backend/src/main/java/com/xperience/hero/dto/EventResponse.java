package com.xperience.hero.dto;

import com.xperience.hero.entity.EventStatus;

import java.time.Instant;
import java.util.UUID;

public record EventResponse(
        UUID id,
        String title,
        String description,
        Instant startTime,
        String location,
        Integer maxCapacity,
        EventStatus status
) {}
