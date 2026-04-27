package com.xperience.hero.service;

import com.xperience.hero.entity.User;
import com.xperience.hero.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public User findOrCreate(String email) {
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.save(User.builder().email(email).build()));
    }
}
