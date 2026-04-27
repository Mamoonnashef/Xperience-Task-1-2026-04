package com.xperience.hero.controller;

import com.xperience.hero.dto.RsvpView;
import com.xperience.hero.dto.SubmitRsvpRequest;
import com.xperience.hero.service.RsvpService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/rsvp")
@RequiredArgsConstructor
public class RsvpController {

    private final RsvpService rsvpService;

    @GetMapping("/{token}")
    public RsvpView getRsvp(@PathVariable UUID token) {
        return rsvpService.getRsvp(token);
    }

    @PutMapping("/{token}")
    public RsvpView submitRsvp(
            @PathVariable UUID token,
            @RequestBody SubmitRsvpRequest request) {
        return rsvpService.submitRsvp(token, request.response());
    }
}
