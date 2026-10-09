package com.spms.service;

import com.spms.entity.*;
import com.spms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service @RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notifications;
    private final UserAccountRepository users;

    public void send(String recipient, String message) {
        var notification = new Notification();
        notification.setRecipient(recipient);
        notification.setMessage(message);
        notifications.save(notification);
    }

    public void notifyAdmins(String message) {
        users.findAll().stream().filter(u -> u.isEnabled() && u.getRole() == UserAccount.Role.ADMIN)
                .forEach(u -> send(u.getUsername(), message));
    }
}
