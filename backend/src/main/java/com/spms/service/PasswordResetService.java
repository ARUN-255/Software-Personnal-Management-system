package com.spms.service;

import com.spms.dto.Dtos;
import com.spms.entity.PasswordResetToken;
import com.spms.repository.*;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class PasswordResetService {
    private final UserAccountRepository users;
    private final EmployeeRepository employees;
    private final PasswordResetTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final EmailService email;
    private final SecureRandom random = new SecureRandom();
    @Transactional public void request(Dtos.PasswordResetRequest request) {
        var user = users.findByUsername(request.username()).orElse(null);
        var employee = employees.findByUserAccountUsername(request.username()).orElse(null);
        if (user == null || employee == null || employee.getEmail() == null || !employee.getEmail().equalsIgnoreCase(request.email())) return;
        var recent = tokens.findTop5ByUserUsernameAndUsedFalseOrderByCreatedAtDesc(user.getUsername());
        if (!recent.isEmpty() && recent.get(0).getCreatedAt().isAfter(LocalDateTime.now().minusMinutes(1))) return;
        recent.forEach(token -> token.setUsed(true)); tokens.saveAll(recent);
        String code = String.format("%06d", random.nextInt(1_000_000));
        var token = new PasswordResetToken(); token.setUser(user); token.setCodeHash(encoder.encode(code)); token.setExpiresAt(LocalDateTime.now().plusMinutes(10)); tokens.save(token);
        email.send(employee.getEmail(), "Bronzera Labs password reset code", "Your password reset code is " + code + ". It expires in 10 minutes. If you did not request this, ignore this email.");
    }
    @Transactional public void confirm(Dtos.PasswordResetConfirm request) {
        var valid = tokens.findTop5ByUserUsernameAndUsedFalseOrderByCreatedAtDesc(request.username()).stream()
                .filter(token -> token.getExpiresAt().isAfter(LocalDateTime.now()))
                .filter(token -> encoder.matches(request.code(), token.getCodeHash())).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("The reset code is invalid or expired"));
        var user = valid.getUser(); user.setPasswordHash(encoder.encode(request.newPassword())); user.setMustChangePassword(false); valid.setUsed(true);
        users.save(user); tokens.save(valid);
    }
}
