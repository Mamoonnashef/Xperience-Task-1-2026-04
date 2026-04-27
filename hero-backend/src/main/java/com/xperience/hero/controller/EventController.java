package com.xperience.hero.controller;

import com.xperience.hero.dto.*;
import com.xperience.hero.entity.Event;
import com.xperience.hero.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse createEvent(
            @RequestHeader("X-Host-Id") UUID hostId,
            @RequestBody CreateEventRequest request) {
        return toResponse(eventService.createEvent(hostId, request));
    }

    @PostMapping("/{id}/invite")
    @ResponseStatus(HttpStatus.OK)
    public void invitePeople(
            @PathVariable UUID id,
            @RequestHeader("X-Host-Id") UUID hostId,
            @RequestBody InviteRequest request) {
        eventService.invitePeople(id, hostId, request.emails());
    }

    @GetMapping("/{id}/dashboard")
    public DashboardResponse getDashboard(
            @PathVariable UUID id,
            @RequestHeader("X-Host-Id") UUID hostId) {
        return eventService.getDashboard(id, hostId);
    }

    @PostMapping("/{id}/cancel")
    public EventResponse cancelEvent(
            @PathVariable UUID id,
            @RequestHeader("X-Host-Id") UUID hostId) {
        return toResponse(eventService.cancelEvent(id, hostId));
    }

    @PostMapping("/{id}/close")
    public EventResponse closeEvent(
            @PathVariable UUID id,
            @RequestHeader("X-Host-Id") UUID hostId) {
        return toResponse(eventService.closeEvent(id, hostId));
    }

    private EventResponse toResponse(Event e) {
        return new EventResponse(e.getId(), e.getTitle(), e.getDescription(),
                e.getStartTime(), e.getLocation(), e.getMaxCapacity(), e.getStatus());
    }
}
