package com.spms.repository;

import com.spms.entity.Notification;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.*;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findTop100ByRecipientOrderByCreatedAtDesc(String recipient);
    Page<Notification> findByRecipientOrderByCreatedAtDesc(String recipient, Pageable pageable);
    Optional<Notification> findByIdAndRecipient(UUID id, String recipient);
}
