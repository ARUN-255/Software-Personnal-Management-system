package com.spms.controller;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.spms.dto.Dtos;
import com.spms.service.AuthService;
import java.util.*;
@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor public class AuthController {
    private final AuthService auth;
    private final com.spms.service.PasswordResetService passwordReset;
    @GetMapping("/csrf") public Map<String, String> csrf(org.springframework.security.web.csrf.CsrfToken token) {
        return Map.of("token", token.getToken());
    }
    @PostMapping("/login")public Map<String, Object> login(@Valid @RequestBody Dtos.LoginRequest r, HttpServletRequest q) {
        return auth.login(r, q);
    }
    @GetMapping("/session")public Map<String, Object> session(Authentication a) {
        return Map.of("username", a.getName(), "role", a.getAuthorities().iterator().next().getAuthority().replace("ROLE_", ""));
    }
    @PostMapping("/change-password")public void change(Authentication a, @Valid @RequestBody Dtos.ChangePasswordRequest r) {
        auth.change(a.getName(), r);
    }
    @PostMapping("/logout")public void logout(HttpServletRequest r) {
        var s=r.getSession(false);
        if(s!=null)s.invalidate();
    }
    @PostMapping("/password-reset/request") public Map<String, String> requestReset(@Valid @RequestBody Dtos.PasswordResetRequest request) {
        passwordReset.request(request);
        return Map.of("message", "If the account details match, a reset code has been emailed.");
    }
    @PostMapping("/password-reset/confirm") public Map<String, String> confirmReset(@Valid @RequestBody Dtos.PasswordResetConfirm request) {
        passwordReset.confirm(request);
        return Map.of("message", "Password reset successfully");
    }
}
