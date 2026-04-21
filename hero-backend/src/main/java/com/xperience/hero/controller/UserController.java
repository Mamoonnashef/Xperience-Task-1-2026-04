package com.xperience.hero.controller;

import com.xperience.hero.dto.UserResponse;
import com.xperience.hero.entity.User;
import com.xperience.hero.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

// Placeholder until host authentication is resolved.
// Provides a way to create/find a user by email and get back a UUID for X-Host-Id.
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse findOrCreate(@RequestParam String email) {
        User user = userService.findOrCreate(email);
        return new UserResponse(user.getId(), user.getEmail());
    }
}
