package com.xperience.hero.dto;

import com.xperience.hero.entity.RsvpResponse;
import com.xperience.hero.entity.RsvpStatus;

import java.util.List;
import java.util.UUID;

public record DashboardResponse(
        UUID eventId,
        String title,
        long confirmed,
        long waitlisted,
        long maybe,
        long declined,
        long pending,
        List<AttendeeRow> attendees
) {
    public record AttendeeRow(String email, RsvpResponse response, RsvpStatus status) {}
}
