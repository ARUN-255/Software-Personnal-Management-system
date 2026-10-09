package com.spms.repository;

import com.spms.entity.Notification;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findTop100ByRecipientOrderByCreatedAtDesc(String recipient);
    Optional<Notification> findByIdAndRecipient(UUID id, String recipient);
}
