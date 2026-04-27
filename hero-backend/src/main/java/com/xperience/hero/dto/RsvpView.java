package com.xperience.hero.dto;

import com.xperience.hero.entity.RsvpResponse;
import com.xperience.hero.entity.RsvpStatus;

import java.util.UUID;

public record RsvpView(
        UUID invitationId,
        String email,
        String eventTitle,
        RsvpResponse response,
        RsvpStatus status
) {}
