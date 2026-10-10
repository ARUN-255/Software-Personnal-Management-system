package com.spms.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service @RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender sender;
    @Value("${app.mail.enabled:false}") private boolean enabled;
    @Value("${app.mail.from}") private String from;
    public boolean enabled() { return enabled; }
    public boolean send(String recipient, String subject, String body) {
        if (!enabled || recipient == null || recipient.isBlank()) return false;
        try {
            var message = new SimpleMailMessage();
            message.setFrom(from); message.setTo(recipient); message.setSubject(subject); message.setText(body);
            sender.send(message);
            return true;
        } catch (RuntimeException error) {
            LoggerFactory.getLogger(getClass()).warn("Email delivery failed: {}", error.getClass().getSimpleName());
            return false;
        }
    }
}
