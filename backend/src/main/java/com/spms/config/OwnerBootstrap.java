package com.spms.config;

import com.spms.entity.UserAccount;
import com.spms.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration @RequiredArgsConstructor
public class OwnerBootstrap {
    private final UserAccountRepository users;
    private final PasswordEncoder encoder;
    @Value("${app.bootstrap.owner-username:owner}") private String username;
    @Value("${app.bootstrap.owner-password:}") private String password;

    @Bean CommandLineRunner bootstrapOwner() {
        return args -> {
            if (users.count() != 0 || password.isBlank()) return;
            if (password.length() < 12) throw new IllegalArgumentException("Bootstrap owner password requires at least 12 characters");
            var owner = new UserAccount();
            owner.setUsername(username);
            owner.setPasswordHash(encoder.encode(password));
            owner.setRole(UserAccount.Role.OWNER);
            owner.setMustChangePassword(true);
            users.save(owner);
        };
    }
}
